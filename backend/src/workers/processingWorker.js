import { Worker } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { processingJobRepository } from '../repositories/processingJobRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { PROCESSING_STATUS } from '../constants/contentTypes.js';
import { logger } from '../utils/logger.js';

const STAGE_TIMINGS_MS = {
  VALIDATING: 150,
  PREPARING: 200,
  TRANSCRIBING: 300,
  DIARIZING: 250,
  ANALYZING: 300,
  GENERATING_EMBEDDINGS: 200,
  GENERATING_REPORT: 200
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute mock processing stages for a single job
 */
export async function executeMockProcessingPipeline(jobRecord, bullJob = null) {
  const content = await contentRepository.findById(jobRecord.contentId);
  if (!content) throw new Error('Content record not found for processing');

  // Controlled failure test detection
  const isControlledFailure = config.queue.mockFailure ||
    (content.title && content.title.includes('[FAIL_TEST]'));

  // Mark PROCESSING started
  jobRecord.status = 'PROCESSING';
  jobRecord.startedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] Pipeline processing initiated`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.PROCESSING,
    processingProgress: 5
  });

  const stages = [
    { stage: PROCESSING_STATUS.VALIDATING, progress: 15 },
    { stage: PROCESSING_STATUS.PREPARING, progress: 30 },
    { stage: PROCESSING_STATUS.TRANSCRIBING, progress: 50 },
    { stage: PROCESSING_STATUS.DIARIZING, progress: 70 },
    { stage: PROCESSING_STATUS.ANALYZING, progress: 85 },
    { stage: PROCESSING_STATUS.GENERATING_REPORT, progress: 95 }
  ];

  for (const step of stages) {
    // Check cancellation
    const currentCheck = await processingJobRepository.findById(jobRecord._id);
    if (currentCheck && currentCheck.status === 'CANCELLED') {
      logger.info('Processing pipeline halted: Job cancelled by user', { jobId: jobRecord.jobId });
      return;
    }

    // Trigger controlled failure if requested
    if (isControlledFailure && step.stage === PROCESSING_STATUS.TRANSCRIBING) {
      throw new Error('Controlled Mock Pipeline Failure triggered for test verification');
    }

    jobRecord.stage = step.stage;
    jobRecord.progress = step.progress;
    jobRecord.logs.push(`[${new Date().toISOString()}] Stage updated: ${step.stage} (${step.progress}%)`);
    await jobRecord.save();

    await contentRepository.updateById(content._id, {
      processingStatus: step.stage,
      processingProgress: step.progress
    });

    if (bullJob) {
      await bullJob.updateProgress(step.progress).catch(() => {});
    }

    await delay(STAGE_TIMINGS_MS[step.stage] || 100);
  }

  // Mark COMPLETED
  jobRecord.status = 'COMPLETED';
  jobRecord.stage = PROCESSING_STATUS.COMPLETED;
  jobRecord.progress = 100;
  jobRecord.completedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] Processing pipeline completed successfully`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.COMPLETED,
    processingProgress: 100
  });

  logger.info('Mock processing pipeline completed successfully', {
    jobId: jobRecord.jobId,
    contentId: content._id.toString()
  });

  return jobRecord;
}

/**
 * Initialize BullMQ Background Worker
 */
export function createProcessingWorker() {
  const connection = getRedisConnectionOptions();

  const worker = new Worker(
    config.queue.name,
    async (bullJob) => {
      const { jobRecordId, jobId } = bullJob.data;
      logger.info('Worker processing BullMQ job', { jobId, attempt: bullJob.attemptsMade + 1 });

      const jobRecord = await processingJobRepository.findById(jobRecordId);
      if (!jobRecord) {
        throw new Error(`ProcessingJob ${jobRecordId} not found in database`);
      }

      jobRecord.attempts = bullJob.attemptsMade + 1;
      await jobRecord.save();

      try {
        await executeMockProcessingPipeline(jobRecord, bullJob);
      } catch (err) {
        jobRecord.status = 'FAILED';
        jobRecord.error = {
          message: err.message || 'Pipeline processing failed',
          failedAt: new Date().toISOString()
        };
        jobRecord.logs.push(`[${new Date().toISOString()}] [ERROR] ${err.message}`);
        await jobRecord.save();

        await contentRepository.updateById(jobRecord.contentId, {
          processingStatus: PROCESSING_STATUS.FAILED,
          processingError: { message: err.message }
        });

        logger.error('Worker job processing failed', { jobId, error: err.message });
        throw err;
      }
    },
    {
      connection,
      concurrency: config.queue.concurrency
    }
  );

  worker.on('completed', (job) => {
    logger.info('BullMQ job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.warn('BullMQ job failed', { jobId: job?.id, error: err?.message });
  });

  worker.on('error', (err) => {
    logger.warn('BullMQ worker error:', { error: err.message });
  });

  logger.info('BullMQ Content Processing Worker started', {
    queue: config.queue.name,
    concurrency: config.queue.concurrency
  });

  return worker;
}
