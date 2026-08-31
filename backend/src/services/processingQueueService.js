import crypto from 'crypto';
import { getProcessingQueue } from '../queues/contentProcessingQueue.js';
import { processingJobRepository } from '../repositories/processingJobRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { ApiError } from '../utils/ApiError.js';
import { PROCESSING_STATUS } from '../constants/contentTypes.js';
import { logger } from '../utils/logger.js';

export const processingQueueService = {
  /**
   * Enqueue content for asynchronous processing with strict idempotency
   */
  async enqueueContentProcessing(contentId, userId, options = {}) {
    const content = await contentRepository.findById(contentId);
    if (!content || content.isDeleted) {
      throw ApiError.notFound('Content not found for processing');
    }

    // Idempotency: Return existing active job if already QUEUED or PROCESSING
    const existingActive = await processingJobRepository.findActiveByContentId(contentId);
    if (existingActive) {
      logger.info('Idempotent processing request: Active job already exists', {
        contentId: contentId.toString(),
        jobId: existingActive.jobId,
        status: existingActive.status
      });
      return existingActive;
    }

    const uniqueJobId = `job_${crypto.randomUUID()}`;
    const jobType = options.jobType || 'FULL_PIPELINE';

    // 1. Create MongoDB ProcessingJob Record
    const processingJob = await processingJobRepository.create({
      contentId,
      userId,
      jobId: uniqueJobId,
      jobType,
      stage: PROCESSING_STATUS.QUEUED,
      status: 'QUEUED',
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      logs: [`[${new Date().toISOString()}] Job enqueued in BullMQ queue`]
    });

    // 2. Update Content state to QUEUED
    await contentRepository.updateById(contentId, {
      processingStatus: PROCESSING_STATUS.QUEUED,
      processingProgress: 0,
      processingError: null
    });

    // 3. Add to BullMQ Queue with graceful fallback for offline/test environments
    try {
      const queue = getProcessingQueue();
      await queue.add(
        'process-content',
        {
          jobRecordId: processingJob._id.toString(),
          jobId: uniqueJobId,
          contentId: contentId.toString(),
          userId: userId.toString(),
          jobType
        },
        {
          jobId: uniqueJobId
        }
      );
      logger.info('Content processing job successfully added to BullMQ', { uniqueJobId, contentId: contentId.toString() });
    } catch (queueErr) {
      logger.warn('Failed to add job to Redis BullMQ (Queue unavailable / Offline mode):', { error: queueErr.message });
      // In offline/test mode without active Redis, the job record exists and is ready for worker pickup
    }

    // 4. Audit Log
    await auditLogRepository.createLog({
      userId,
      action: 'PROCESSING_JOB_ENQUEUED',
      resourceType: 'PROCESSING_JOB',
      resourceId: processingJob._id.toString(),
      metadata: { contentId: contentId.toString(), jobId: uniqueJobId }
    });

    return processingJob;
  },

  /**
   * Get single job details with multi-tenant ownership check
   */
  async getJobById(jobIdOrRecordId, userId, userRole) {
    let job = await processingJobRepository.findByJobId(jobIdOrRecordId);
    if (!job) {
      job = await processingJobRepository.findById(jobIdOrRecordId);
    }
    if (!job) {
      throw ApiError.notFound('Processing job not found');
    }

    if (job.userId.toString() !== userId.toString() && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to access this processing job');
    }

    return job;
  },

  /**
   * Get latest job by content ID
   */
  async getJobByContentId(contentId, userId, userRole) {
    const job = await processingJobRepository.findLatestByContentId(contentId);
    if (!job) {
      throw ApiError.notFound('No processing jobs found for this content');
    }

    if (job.userId.toString() !== userId.toString() && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to view processing for this content');
    }

    return job;
  },

  /**
   * Retry a failed processing job
   */
  async retryJob(jobIdOrRecordId, userId, userRole) {
    const job = await this.getJobById(jobIdOrRecordId, userId, userRole);

    if (!['FAILED', 'CANCELLED'].includes(job.status)) {
      throw ApiError.badRequest(`Cannot retry job with status '${job.status}'. Only FAILED or CANCELLED jobs can be retried.`);
    }

    // Reset job record
    job.status = 'QUEUED';
    job.stage = PROCESSING_STATUS.QUEUED;
    job.progress = 0;
    job.error = null;
    job.attempts = 0;
    job.completedAt = null;
    job.logs.push(`[${new Date().toISOString()}] Job manually retried by ${userRole === 'ADMIN' ? 'admin' : 'user'}`);
    await job.save();

    // Reset content record
    await contentRepository.updateById(job.contentId, {
      processingStatus: PROCESSING_STATUS.QUEUED,
      processingProgress: 0,
      processingError: null
    });

    // Re-enqueue to BullMQ
    try {
      const queue = getProcessingQueue();
      await queue.add(
        'process-content',
        {
          jobRecordId: job._id.toString(),
          jobId: job.jobId,
          contentId: job.contentId.toString(),
          userId: job.userId.toString(),
          jobType: job.jobType
        },
        {
          jobId: `${job.jobId}_retry_${Date.now()}`
        }
      );
    } catch (queueErr) {
      logger.warn('Failed to re-enqueue job into BullMQ:', { error: queueErr.message });
    }

    await auditLogRepository.createLog({
      userId,
      action: 'PROCESSING_JOB_RETRIED',
      resourceType: 'PROCESSING_JOB',
      resourceId: job._id.toString(),
      metadata: { jobId: job.jobId }
    });

    return job;
  },

  /**
   * Cancel an active or queued processing job
   */
  async cancelJob(jobIdOrRecordId, userId, userRole) {
    const job = await this.getJobById(jobIdOrRecordId, userId, userRole);

    if (['COMPLETED', 'CANCELLED'].includes(job.status)) {
      throw ApiError.badRequest(`Cannot cancel job with status '${job.status}'`);
    }

    job.status = 'CANCELLED';
    job.stage = PROCESSING_STATUS.CANCELLED;
    job.logs.push(`[${new Date().toISOString()}] Job cancelled by ${userRole === 'ADMIN' ? 'admin' : 'user'}`);
    await job.save();

    await contentRepository.updateById(job.contentId, {
      processingStatus: PROCESSING_STATUS.CANCELLED
    });

    // Attempt removal from BullMQ queue if waiting
    try {
      const queue = getProcessingQueue();
      const bullJob = await queue.getJob(job.jobId);
      if (bullJob) {
        await bullJob.remove().catch(() => {});
      }
    } catch (err) {
      // Non-fatal if queue is offline
    }

    await auditLogRepository.createLog({
      userId,
      action: 'PROCESSING_JOB_CANCELLED',
      resourceType: 'PROCESSING_JOB',
      resourceId: job._id.toString(),
      metadata: { jobId: job.jobId }
    });

    return job;
  },

  /**
   * List paginated user jobs
   */
  async listUserJobs(userId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { items, total } = await processingJobRepository.findUserJobs(userId, {
      skip,
      limit,
      status: query.status
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Admin: List all processing jobs with telemetry
   */
  async listAllJobsAdmin(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { items, total } = await processingJobRepository.findAllAdmin({
      skip,
      limit,
      status: query.status
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Admin: Summary metrics from BullMQ and Database
   */
  async getMetrics() {
    let queueCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    try {
      const queue = getProcessingQueue();
      queueCounts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    } catch {
      // Return defaults if Redis is offline
    }

    const [totalDb, activeDb, completedDb, failedDb] = await Promise.all([
      processingJobRepository.findAllAdmin({ limit: 1 }),
      processingJobRepository.findAllAdmin({ status: 'PROCESSING', limit: 1 }),
      processingJobRepository.findAllAdmin({ status: 'COMPLETED', limit: 1 }),
      processingJobRepository.findAllAdmin({ status: 'FAILED', limit: 1 })
    ]);

    return {
      queue: queueCounts,
      database: {
        totalJobs: totalDb.total,
        activeJobs: activeDb.total,
        completedJobs: completedDb.total,
        failedJobs: failedDb.total
      }
    };
  }
};
