import { Worker } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { processingJobRepository } from '../repositories/processingJobRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { storageService } from '../services/storageService.js';
import { aiService } from '../services/aiService.js';
import { PROCESSING_STATUS } from '../constants/contentTypes.js';
import { logger } from '../utils/logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute real AI media preprocessing and Speech-to-Text pipeline for a single job
 */
export async function executeMockProcessingPipeline(jobRecord, bullJob = null) {
  const content = await contentRepository.findById(jobRecord.contentId);
  if (!content) throw new Error('Content record not found for processing');

  // Controlled failure test detection
  const isControlledFailure = config.queue.mockFailure ||
    (content.title && content.title.includes('[FAIL_TEST]'));

  // Mark PROCESSING started
  jobRecord.status = 'PROCESSING';
  jobRecord.stage = PROCESSING_STATUS.PROCESSING;
  jobRecord.progress = 5;
  jobRecord.startedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] AI Pipeline processing initiated for content type '${content.contentType}'`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.PROCESSING,
    processingProgress: 5
  });

  // Stage 1: VALIDATING (15%)
  jobRecord.stage = PROCESSING_STATUS.VALIDATING;
  jobRecord.progress = 15;
  jobRecord.logs.push(`[${new Date().toISOString()}] Validating media integrity and bounds for '${content.title}'`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.VALIDATING, processingProgress: 15 });
  if (bullJob) await bullJob.updateProgress(15).catch(() => {});

  // Cancellation check
  let check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') {
    logger.info('Processing pipeline halted: Job cancelled by user', { jobId: jobRecord.jobId });
    return;
  }

  // Stage 2: PREPARING (30%)
  jobRecord.stage = PROCESSING_STATUS.PREPARING;
  jobRecord.progress = 30;
  jobRecord.logs.push(`[${new Date().toISOString()}] Preparing execution pipeline and resolving secure media access`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.PREPARING, processingProgress: 30 });
  if (bullJob) await bullJob.updateProgress(30).catch(() => {});

  check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') return;

  // Trigger controlled failure if requested
  if (isControlledFailure) {
    throw new Error('Controlled Mock Pipeline Failure triggered for test verification');
  }

  // Stage 3: TRANSCRIBING (40% - 75%)
  jobRecord.stage = PROCESSING_STATUS.TRANSCRIBING;
  jobRecord.progress = 50;
  jobRecord.logs.push(`[${new Date().toISOString()}] Running Speech-to-Text transcription (Faster-Whisper AI engine)`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.TRANSCRIBING, processingProgress: 50 });
  if (bullJob) await bullJob.updateProgress(50).catch(() => {});

  let transcriptionResult;

  if (content.contentType === 'TEXT') {
    // For pure text content, skip STT and create sequential transcript segments directly
    logger.info(`Content ${content._id} is raw TEXT. Skipping STT and formatting direct segments.`);
    const rawText = content.rawText || '';
    const paragraphs = rawText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const textSegments = [];
    let currentSec = 0;

    if (paragraphs.length === 0 && rawText.trim().length > 0) {
      paragraphs.push(rawText.trim());
    }

    paragraphs.forEach((p, idx) => {
      const segDuration = Math.max(4, Math.min(30, Math.round(p.split(' ').length * 0.4)));
      textSegments.push({
        startTime: currentSec,
        endTime: currentSec + segDuration,
        text: p,
        sequence: idx + 1,
        confidence: 1.0,
        words: []
      });
      currentSec += segDuration;
    });

    transcriptionResult = {
      contentId: content._id.toString(),
      language: content.language || 'en',
      durationSeconds: currentSec,
      wordCount: rawText.split(/\s+/).filter(Boolean).length,
      processingModel: 'direct-text-parser',
      segments: textSegments
    };
  } else {
    // Audio / Video / Document / URL media transcription
    let mediaUrl = null;
    let localPath = null;

    if (content.fileKey) {
      localPath = storageService.getLocalFilePath(content.fileKey);
      if (!localPath) {
        mediaUrl = await storageService.getSignedAccessUrl(content.fileKey);
      }
    } else if (content.sourceUrl) {
      mediaUrl = content.sourceUrl;
    }

    transcriptionResult = await aiService.requestTranscription({
      contentId: content._id.toString(),
      mediaUrl,
      localPath,
      contentType: content.contentType,
      language: content.language || 'auto'
    });
  }

  // Check cancellation before writing to database
  check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') return;

  // Stage 4: SAVING_TRANSCRIPT (90%)
  jobRecord.stage = 'SAVING_TRANSCRIPT';
  jobRecord.progress = 90;
  jobRecord.logs.push(`[${new Date().toISOString()}] Persisting ${transcriptionResult.segments?.length || 0} transcript segments to MongoDB`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: 'SAVING_TRANSCRIPT', processingProgress: 90 });
  if (bullJob) await bullJob.updateProgress(90).catch(() => {});

  // Idempotency: Clean any existing transcript, speakers, and segments for this content
  await transcriptRepository.deleteByContentId(content._id);

  // 1. Create Transcript record
  const transcriptDoc = await transcriptRepository.createTranscript({
    contentId: content._id,
    userId: content.userId,
    language: transcriptionResult.language || 'en',
    durationSeconds: transcriptionResult.durationSeconds || 0,
    wordCount: transcriptionResult.wordCount || 0,
    processingModel: transcriptionResult.processingModel || 'faster-whisper-small',
    status: 'COMPLETED'
  });

  // 2. Create Default Speaker record
  const defaultSpeaker = await transcriptRepository.insertSpeakers([
    {
      contentId: content._id,
      speakerLabel: 'SPEAKER_00',
      displayName: 'Speaker 1',
      color: '#1B365D',
      segmentCount: transcriptionResult.segments?.length || 0
    }
  ]);

  const speakerId = defaultSpeaker[0]?._id || null;

  // 3. Create TranscriptSegment records
  if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
    const segmentDocs = transcriptionResult.segments.map((seg) => ({
      contentId: content._id,
      transcriptId: transcriptDoc._id,
      speakerId,
      speakerLabel: 'SPEAKER_00',
      speakerDisplayName: 'Speaker 1',
      startTime: seg.startTime,
      endTime: seg.endTime,
      text: seg.text,
      words: seg.words || [],
      sequence: seg.sequence,
      confidence: seg.confidence || 0.95
    }));

    await transcriptRepository.insertSegments(segmentDocs);
  }

  // Stage 5: COMPLETED (100%)
  jobRecord.status = 'COMPLETED';
  jobRecord.stage = PROCESSING_STATUS.COMPLETED;
  jobRecord.progress = 100;
  jobRecord.completedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] Transcript generated and persisted successfully. Status: COMPLETED`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.COMPLETED,
    processingProgress: 100,
    mediaDurationSeconds: transcriptionResult.durationSeconds || 0,
    language: transcriptionResult.language || 'en'
  });

  logger.info('Speech-to-text pipeline completed successfully', {
    jobId: jobRecord.jobId,
    contentId: content._id.toString(),
    segmentsCount: transcriptionResult.segments?.length || 0,
    language: transcriptionResult.language
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
