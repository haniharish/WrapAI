import { Worker } from 'bullmq';
import { config } from '../config/environment.js';
import { getRedisConnectionOptions } from '../config/redis.js';
import { processingJobRepository } from '../repositories/processingJobRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { analysisRepository } from '../repositories/analysisRepository.js';
import { storageService } from '../services/storageService.js';
import { aiService } from '../services/aiService.js';
import { embeddingService } from '../services/embeddingService.js';
import { PROCESSING_STATUS } from '../constants/contentTypes.js';
import { logger } from '../utils/logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute real AI media preprocessing, Speech-to-Text, Speaker Diarization, and LLM Content Intelligence pipeline
 */
export async function executeMockProcessingPipeline(jobRecord, bullJob = null) {
  const content = await contentRepository.findById(jobRecord.contentId);
  if (!content) throw new Error('Content record not found for processing');

  const isReanalysisOnly = bullJob?.data?.reanalysisOnly || false;

  // Controlled failure test detection
  const isControlledFailure = config.queue.mockFailure ||
    (content.title && content.title.includes('[FAIL_TEST]'));

  // Mark PROCESSING started
  jobRecord.status = 'PROCESSING';
  jobRecord.stage = PROCESSING_STATUS.PROCESSING;
  jobRecord.progress = 5;
  jobRecord.startedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] AI Pipeline processing initiated for content '${content.title}' (Mode: ${isReanalysisOnly ? 'Re-Analysis' : 'Full Pipeline'})`);
  await jobRecord.save();

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.PROCESSING,
    processingProgress: 5
  });

  // Stage 1: VALIDATING (10%)
  jobRecord.stage = PROCESSING_STATUS.VALIDATING;
  jobRecord.progress = 10;
  jobRecord.logs.push(`[${new Date().toISOString()}] Validating media integrity and bounds for '${content.title}'`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.VALIDATING, processingProgress: 10 });
  if (bullJob) await bullJob.updateProgress(10).catch(() => {});

  // Cancellation check
  let check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') {
    logger.info('Processing pipeline halted: Job cancelled by user', { jobId: jobRecord.jobId });
    return;
  }

  // Stage 2: PREPARING (20%)
  jobRecord.stage = PROCESSING_STATUS.PREPARING;
  jobRecord.progress = 20;
  jobRecord.logs.push(`[${new Date().toISOString()}] Preparing execution pipeline and resolving secure media access`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.PREPARING, processingProgress: 20 });
  if (bullJob) await bullJob.updateProgress(20).catch(() => {});

  check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') return;

  if (isControlledFailure) {
    throw new Error('Controlled Mock Pipeline Failure triggered for test verification');
  }

  let finalTranscriptSegments = [];
  let finalSpeakers = [];
  let transcriptDoc = null;
  let calculatedDuration = content.mediaDurationSeconds || 0;

  // If this is a full processing run (not re-analysis only), execute transcription and diarization
  if (!isReanalysisOnly) {
    // Stage 3: TRANSCRIBING (40%)
    jobRecord.stage = PROCESSING_STATUS.TRANSCRIBING;
    jobRecord.progress = 40;
    jobRecord.logs.push(`[${new Date().toISOString()}] Running Speech-to-Text transcription (Faster-Whisper AI engine)`);
    await jobRecord.save();
    await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.TRANSCRIBING, processingProgress: 40 });
    if (bullJob) await bullJob.updateProgress(40).catch(() => {});

    let transcriptionResult;

    if (content.contentType === 'TEXT') {
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

      // Stage 4: DIARIZING (55%)
      jobRecord.stage = PROCESSING_STATUS.DIARIZING;
      jobRecord.progress = 55;
      jobRecord.logs.push(`[${new Date().toISOString()}] Running pyannote speaker diarization & turn clustering`);
      await jobRecord.save();
      await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.DIARIZING, processingProgress: 55 });
      if (bullJob) await bullJob.updateProgress(55).catch(() => {});

      transcriptionResult = await aiService.requestTranscription({
        contentId: content._id.toString(),
        mediaUrl,
        localPath,
        contentType: content.contentType,
        language: content.language || 'auto',
        enableDiarization: true
      });

      // Stage 5: ALIGNING_SPEAKERS (70%)
      jobRecord.stage = PROCESSING_STATUS.ALIGNING_SPEAKERS;
      jobRecord.progress = 70;
      jobRecord.logs.push(`[${new Date().toISOString()}] Aligning ${transcriptionResult.segments?.length || 0} segments with ${transcriptionResult.speakers?.length || 1} speakers`);
      await jobRecord.save();
      await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.ALIGNING_SPEAKERS, processingProgress: 70 });
      if (bullJob) await bullJob.updateProgress(70).catch(() => {});
    }

    check = await processingJobRepository.findById(jobRecord._id);
    if (check && check.status === 'CANCELLED') return;

    // Stage 6: SAVING_TRANSCRIPT (75%)
    jobRecord.stage = PROCESSING_STATUS.SAVING_TRANSCRIPT;
    jobRecord.progress = 75;
    jobRecord.logs.push(`[${new Date().toISOString()}] Persisting speaker-aware transcript and manifest to MongoDB Atlas`);
    await jobRecord.save();
    await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.SAVING_TRANSCRIPT, processingProgress: 75 });
    if (bullJob) await bullJob.updateProgress(75).catch(() => {});

    // Idempotency: Clean prior transcripts/speakers for this content
    await transcriptRepository.deleteByContentId(content._id);

    // 1. Create Transcript record
    transcriptDoc = await transcriptRepository.createTranscript({
      contentId: content._id,
      userId: content.userId,
      language: transcriptionResult.language || 'en',
      durationSeconds: transcriptionResult.durationSeconds || 0,
      wordCount: transcriptionResult.wordCount || 0,
      processingModel: transcriptionResult.processingModel || 'faster-whisper-small',
      status: 'COMPLETED'
    });

    // 2. Create Speaker records
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

    const speakerMap = new Map();
    insertedSpeakers.forEach((s) => {
      speakerMap.set(s.speakerLabel, s._id);
    });

    // 3. Create TranscriptSegment records
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

    finalTranscriptSegments = transcriptionResult.segments;
    finalSpeakers = insertedSpeakers;
    calculatedDuration = transcriptionResult.durationSeconds || calculatedDuration;
  } else {
    // Re-analysis only mode: retrieve existing transcript segments from DB
    const existing = await transcriptRepository.findByContentId(content._id);
    transcriptDoc = existing.transcript;
    finalTranscriptSegments = existing.segments;
    finalSpeakers = existing.speakers;
  }

  check = await processingJobRepository.findById(jobRecord._id);
  if (check && check.status === 'CANCELLED') return;

  // Stage 7: ANALYZING_CONTENT (90%)
  jobRecord.stage = PROCESSING_STATUS.ANALYZING_CONTENT;
  jobRecord.progress = 90;
  jobRecord.logs.push(`[${new Date().toISOString()}] Running LLM Content Intelligence analysis (Summaries, Topics, Decisions, Action Items)`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.ANALYZING_CONTENT, processingProgress: 90 });
  if (bullJob) await bullJob.updateProgress(90).catch(() => {});

  const analysisResult = await aiService.requestAnalysis({
    contentId: content._id.toString(),
    title: content.title,
    language: content.language || 'en',
    durationSeconds: content.mediaDurationSeconds || 0.0,
    speakers: finalSpeakers.map((s) => ({
      speakerLabel: s.speakerLabel,
      displayName: s.displayName,
      totalSpeakingTime: s.totalSpeakingTimeSeconds || 0,
      segmentCount: s.segmentCount || 0,
      color: s.avatarColor || '#1B365D'
    })),
    segments: finalTranscriptSegments.map((seg) => ({
      startTime: seg.startTime,
      endTime: seg.endTime,
      text: seg.text,
      sequence: seg.sequence,
      speakerLabel: seg.speakerLabel || 'SPEAKER_00',
      speakerDisplayName: seg.speakerDisplayName || 'Speaker 1'
    }))
  });

  // Stage 8: SAVING_ANALYSIS (95%)
  jobRecord.stage = PROCESSING_STATUS.SAVING_ANALYSIS;
  jobRecord.progress = 95;
  jobRecord.logs.push(`[${new Date().toISOString()}] Persisting structured intelligence, topics, decisions, and action items to MongoDB Atlas`);
  await jobRecord.save();
  await contentRepository.updateById(content._id, { processingStatus: PROCESSING_STATUS.SAVING_ANALYSIS, processingProgress: 95 });
  if (bullJob) await bullJob.updateProgress(95).catch(() => {});

  // Clean prior analysis collections for idempotency
  await analysisRepository.deleteByContentId(content._id);

  // 1. Create Analysis record
  await analysisRepository.createAnalysis({
    contentId: content._id,
    transcriptId: transcriptDoc?._id || null,
    version: 1,
    contentCategory: analysisResult.contentCategory || 'MEETING',
    summary: analysisResult.summary,
    topics: analysisResult.topics || [],
    keyPoints: analysisResult.keyPoints || [],
    decisions: analysisResult.decisions || [],
    actionItems: analysisResult.actionItems || [],
    questions: analysisResult.questions || [],
    highlights: analysisResult.highlights || [],
    llmProvider: analysisResult.llmProvider || 'heuristic',
    llmModel: analysisResult.llmModel || 'gemini-2.5-flash',
    promptVersion: analysisResult.promptVersion || 'v1.0',
    tokenUsage: analysisResult.tokenUsage || { totalTokens: 0 },
    status: 'COMPLETED'
  });

  // 2. Persist discrete Topic records
  if (analysisResult.topics && analysisResult.topics.length > 0) {
    const topicDocs = analysisResult.topics.map((t, idx) => ({
      contentId: content._id,
      title: t.title,
      summary: t.summary || '',
      startTime: t.startTime,
      endTime: t.endTime,
      sequence: t.sequence || idx + 1,
      keyTakeaway: t.keyTakeaway || ''
    }));
    await analysisRepository.insertTopics(topicDocs);
  }

  // 3. Persist discrete Decision records
  if (analysisResult.decisions && analysisResult.decisions.length > 0) {
    const decisionDocs = analysisResult.decisions.map((d) => ({
      contentId: content._id,
      title: d.title,
      description: d.description,
      context: d.description,
      timestamp: d.timestamp,
      category: d.category || 'Architecture',
      agreedByNames: d.agreedByNames || []
    }));
    await analysisRepository.insertDecisions(decisionDocs);
  }

  // 4. Persist discrete ActionItem records
  if (analysisResult.actionItems && analysisResult.actionItems.length > 0) {
    const actionDocs = analysisResult.actionItems.map((a) => ({
      contentId: content._id,
      task: a.task,
      ownerName: a.ownerName || 'Unassigned',
      deadlineRaw: a.deadlineRaw || 'Next Sprint',
      status: a.status || 'PENDING',
      timestamp: a.timestamp || 0
    }));
    await analysisRepository.insertActionItems(actionDocs);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 10: CHUNKING → GENERATING_EMBEDDINGS → INDEXING
  // ─────────────────────────────────────────────────────────────────────
  let embeddingChunksCount = 0;
  let embeddingModelName = 'heuristic-embedding-v1';
  try {
    // Stage: CHUNKING (62%)
    jobRecord.stage = PROCESSING_STATUS.CHUNKING;
    jobRecord.progress = 62;
    jobRecord.logs.push(`[${new Date().toISOString()}] Splitting transcript into semantic chunks for vector indexing`);
    await jobRecord.save();
    await contentRepository.updateById(content._id, {
      processingStatus: PROCESSING_STATUS.CHUNKING,
      processingProgress: 62,
      indexingStatus: 'INDEXING'
    });
    if (bullJob) await bullJob.updateProgress(62).catch(() => {});

    // Fetch segments for embedding (may already be in scope)
    const segmentsForEmbedding = finalTranscriptSegments && finalTranscriptSegments.length > 0
      ? finalTranscriptSegments
      : (transcriptDoc ? await transcriptRepository.findSegmentsByTranscriptId(transcriptDoc._id) : []);

    const { chunksCount, embeddingModel } = await embeddingService.indexContent({
      contentId: content._id.toString(),
      userId: content.userId.toString(),
      transcriptId: transcriptDoc?._id?.toString() || null,
      segments: segmentsForEmbedding,
      onProgress: async ({ stage, percent, message }) => {
        jobRecord.progress = percent;
        jobRecord.logs.push(`[${new Date().toISOString()}] ${message}`);
        await jobRecord.save().catch(() => {});
        await contentRepository.updateById(content._id, { processingProgress: percent }).catch(() => {});
        if (bullJob) await bullJob.updateProgress(percent).catch(() => {});
      }
    });

    embeddingChunksCount = chunksCount;
    embeddingModelName = embeddingModel;

    // Update content with indexing completion
    await contentRepository.updateById(content._id, {
      isIndexed: chunksCount > 0,
      indexingStatus: chunksCount > 0 ? 'INDEXED' : 'FAILED',
      embeddingModel,
      embeddingVersion: 'v1'
    });

    logger.info(`[worker] Embedding indexing complete: ${chunksCount} chunks indexed for content ${content._id}`, {
      embeddingModel
    });
  } catch (embErr) {
    // Non-fatal: log but don't fail the overall pipeline
    logger.warn(`[worker] Embedding indexing failed (non-fatal): ${embErr.message}`, {
      contentId: content._id.toString()
    });
    jobRecord.logs.push(`[${new Date().toISOString()}] [WARN] Embedding indexing failed: ${embErr.message} — continuing to COMPLETED`);
    await contentRepository.updateById(content._id, { indexingStatus: 'FAILED' });
  }

  // Stage 9: COMPLETED (100%)
  jobRecord.status = 'COMPLETED';
  jobRecord.stage = PROCESSING_STATUS.COMPLETED;
  jobRecord.progress = 100;
  jobRecord.completedAt = new Date();
  jobRecord.logs.push(`[${new Date().toISOString()}] Content Intelligence pipeline completed successfully. All topics, decisions, and action items persisted. Status: COMPLETED`);
  await jobRecord.save();

  const formattedKeyPoints = (analysisResult.keyPoints || []).map((kp, idx) => ({
    id: `kp_${idx + 1}`,
    text: kp.text,
    importance: kp.importance || 'MEDIUM',
    speakerName: kp.speakerName || 'Speaker 1',
    category: kp.category || 'General',
    startTime: kp.timestamp || 0,
    endTime: (kp.timestamp || 0) + 10
  }));

  const formattedHighlights = (analysisResult.highlights || []).map((hl, idx) => ({
    id: `hl_${idx + 1}`,
    title: hl.title,
    description: hl.description || '',
    startTime: hl.timestamp || 0,
    endTime: (hl.timestamp || 0) + 15,
    importance: hl.importance || 'HIGH'
  }));

  const formattedSummary = {
    keyTakeaway: analysisResult.summary?.keyTakeaway || '',
    executiveSummary: analysisResult.summary?.executive || analysisResult.summary?.short || '',
    detailedSummary: analysisResult.summary?.executive || '',
    modelVersion: analysisResult.llmModel || 'gemini-2.5-flash',
    generatedAt: new Date()
  };

  await contentRepository.updateById(content._id, {
    processingStatus: PROCESSING_STATUS.COMPLETED,
    processingProgress: 100,
    mediaDurationSeconds: calculatedDuration || 45.0,
    summary: formattedSummary,
    keyPoints: formattedKeyPoints,
    highlights: formattedHighlights,
    speakersCount: finalSpeakers.length || 1
  });

  logger.info('Content intelligence pipeline completed successfully', {
    jobId: jobRecord.jobId,
    contentId: content._id.toString(),
    topicsCount: analysisResult.topics?.length || 0,
    decisionsCount: analysisResult.decisions?.length || 0,
    actionItemsCount: analysisResult.actionItems?.length || 0
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
