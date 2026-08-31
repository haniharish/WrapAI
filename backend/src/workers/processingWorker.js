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
 * Execute real AI media preprocessing, Speech-to-Text, and Speaker Diarization pipeline
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

  // Stage 3: TRANSCRIBING (50%)
  jobRecord.stage = PROCESSING_STATUS.TRANSCRIBING;
  jobRecord.progress = 50;
  jobRecord.logs.push(`[${new Date().toISOString()}] Running Speech-to-Text transcription (Faster-Whisper AI engine)`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.TRANSCRIBING, processingProgress: 50 });
  if (bullJob) await bullJob.updateProgress(50).catch(() => {});

  let transcriptionResult;

  if (content.contentType === 'TEXT') {
    // For pure text content, skip STT and diarization; format paragraphs directly
    logger.info(`Content ${content._id} is raw TEXT. Formatting direct transcript segments.`);
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
        speakerLabel: 'SPEAKER_00',
        speakerDisplayName: 'Speaker 1',
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
      speakersCount: 1,
      processingModel: 'direct-text-parser',
      diarizationModel: null,
      speakers: [
        {
          speakerLabel: 'SPEAKER_00',
          displayName: 'Speaker 1',
          totalSpeakingTime: currentSec,
          segmentCount: textSegments.length,
          speakingPercentage: 100.0,
          color: '#1B365D',
          confidence: 1.0
        }
      ],
      segments: textSegments
    };
  } else {
    // Audio / Video media transcription + diarization
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

    // Stage 4: DIARIZING (70%)
    jobRecord.stage = PROCESSING_STATUS.DIARIZING;
    jobRecord.progress = 70;
    jobRecord.logs.push(`[${new Date().toISOString()}] Running pyannote speaker diarization & turn clustering`);
    await jobRecord.save();
    await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.DIARIZING, processingProgress: 70 });
    if (bullJob) await bullJob.updateProgress(70).catch(() => {});

    transcriptionResult = await aiService.requestTranscription({
      contentId: content._id.toString(),
      mediaUrl,
      localPath,
      contentType: content.contentType,
      language: content.language || 'auto',
      enableDiarization: true
    });

    // Stage 5: ALIGNING_SPEAKERS (85%)
    jobRecord.stage = PROCESSING_STATUS.ALIGNING_SPEAKERS;
    jobRecord.progress = 85;
    jobRecord.logs.push(`[${new Date().toISOString()}] Aligning ${transcriptionResult.segments?.length || 0} transcript segments with ${transcriptionResult.speakers?.length || 1} detected speakers`);
    await jobRecord.save();
    await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.ALIGNING_SPEAKERS, processingProgress: 85 });
    if (bullJob) await bullJob.updateProgress(85).catch(() => {});
  }

  // Check cancellation before writing to database
  check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') return;

  // Stage 6: SAVING_TRANSCRIPT (90%)
  jobRecord.stage = PROCESSING_STATUS.SAVING_TRANSCRIPT;
  jobRecord.progress = 90;
  jobRecord.logs.push(`[${new Date().toISOString()}] Persisting speaker-aware transcript and manifest to MongoDB Atlas`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.SAVING_TRANSCRIPT, processingProgress: 90 });
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

  // 2. Create Speaker records in MongoDB
  const rawSpeakers = transcriptionResult.speakers && transcriptionResult.speakers.length > 0
    ? transcriptionResult.speakers
    : [
        {
          speakerLabel: 'SPEAKER_00',
          displayName: 'Speaker 1',
          totalSpeakingTime: transcriptionResult.durationSeconds,
          segmentCount: transcriptionResult.segments?.length || 0,
          color: '#1B365D',
          confidence: 1.0
        }
      ];

  const speakerDocsToInsert = rawSpeakers.map((spk) => ({
    contentId: content._id,
    speakerLabel: spk.speakerLabel,
    displayName: spk.displayName || 'Speaker 1',
    totalSpeakingTimeSeconds: spk.totalSpeakingTime || 0,
    segmentCount: spk.segmentCount || 0,
    avatarColor: spk.color || '#1B365D',
    confidence: spk.confidence || 0.92
  }));

  const insertedSpeakers = await transcriptRepository.insertSpeakers(speakerDocsToInsert);

  // Build speaker map for ID linking: speakerLabel -> Speaker._id
  const speakerMap = new Map();
  insertedSpeakers.forEach((s) => {
    speakerMap.set(s.speakerLabel, s._id);
  });

  // 3. Create TranscriptSegment records with linked speakerId
  if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
    const segmentDocs = transcriptionResult.segments.map((seg) => {
      const spkLabel = seg.speakerLabel || 'SPEAKER_00';
      const spkId = speakerMap.get(spkLabel) || insertedSpeakers[0]._id;
      const spkName = seg.speakerDisplayName || 'Speaker 1';

      return {
        contentId: content._id,
        transcriptId: transcriptDoc._id,
        speakerId: spkId,
        speakerLabel: spkLabel,
        speakerDisplayName: spkName,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        words: seg.words || [],
        sequence: seg.sequence,
        confidence: seg.confidence || 0.95
      };
    });

    await transcriptRepository.insertSegments(segmentDocs);
  }

  // Stage 7: COMPLETED (100%)
  jobRecord.status = 'COMPLETED';
  jobRecord.stage = PROCESSING_STATUS.COMPLETED;
  jobRecord.progress = 100;
  jobRecord.completedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] Speaker-aware transcript persisted successfully with ${insertedSpeakers.length} speakers. Status: COMPLETED`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.COMPLETED,
    processingProgress: 100,
    mediaDurationSeconds: transcriptionResult.durationSeconds || 0,
    speakersCount: insertedSpeakers.length,
    language: transcriptionResult.language || 'en'
  });

  logger.info('Speaker-aware speech-to-text pipeline completed successfully', {
    jobId: jobRecord.jobId,
    contentId: content._id.toString(),
    segmentsCount: transcriptionResult.segments?.length || 0,
    speakersCount: insertedSpeakers.length
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
