import mongoose from 'mongoose';
import { EmbeddingChunk } from '../models/EmbeddingChunk.js';
import { embeddingRepository } from '../repositories/embeddingRepository.js';
import { aiService } from './aiService.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

const EMBEDDING_VERSION = 'v1';
const CHUNK_BATCH_SIZE = 20; // Embed 20 chunks per API call to stay within limits

/**
 * Simulates transcript chunking on the Node.js side by grouping segments into
 * speaker-and-time-based chunks. The actual chunker lives in Python (chunker.py)
 * and produces the formatted text. Here we do a simple grouping to prepare the
 * chunk data before calling the Python embedding endpoint.
 *
 * @param {Array} segments - TranscriptSegment documents
 * @param {string} contentId
 * @param {string|null} transcriptId
 * @param {string} userId
 * @returns {Array} chunk objects ready for embedding
 */
function buildChunksFromSegments(segments, contentId, transcriptId, userId) {
  if (!segments || segments.length === 0) return [];

  const TARGET_CHARS = 2000; // ~500 tokens
  const OVERLAP_CHARS = 320; // ~80 tokens
  const chunks = [];
  let chunkIndex = 0;
  let currentLines = [];
  let currentChars = 0;
  let currentStart = segments[0]?.startTime || 0;
  let currentEnd = segments[0]?.endTime || 0;
  let currentSpeakerLabel = segments[0]?.speakerLabel || 'SPEAKER_00';
  let currentSpeakerName = segments[0]?.speakerDisplayName || 'Speaker 1';
  let currentSpeakerId = segments[0]?.speakerId || null;
  let currentSegIds = [];
  let overlapTail = '';

  const flush = () => {
    const body = currentLines.join('\n').trim();
    if (!body) return;
    const full = overlapTail ? `${overlapTail}\n${body}`.trim() : body;
    chunks.push({
      contentId: new mongoose.Types.ObjectId(contentId),
      userId: new mongoose.Types.ObjectId(userId),
      transcriptId: transcriptId ? new mongoose.Types.ObjectId(transcriptId) : null,
      chunkIndex,
      text: full,
      startTime: currentStart,
      endTime: currentEnd,
      speakerLabel: currentSpeakerLabel,
      speakerDisplayName: currentSpeakerName,
      speakerId: currentSpeakerId ? new mongoose.Types.ObjectId(currentSpeakerId) : null,
      segmentIds: currentSegIds.map((id) => new mongoose.Types.ObjectId(id)),
      embeddingVersion: EMBEDDING_VERSION
    });
    chunkIndex++;
    overlapTail = full.slice(-OVERLAP_CHARS);
  };

  for (const seg of segments) {
    const text = (seg.text || '').trim();
    if (!text) continue;
    const st = seg.startTime || 0;
    const et = seg.endTime || st;
    const mins = String(Math.floor(st / 60)).padStart(2, '0');
    const secs = String(Math.floor(st % 60)).padStart(2, '0');
    const spName = seg.speakerDisplayName || seg.speakerLabel || 'Speaker';
    const line = `[${mins}:${secs}] ${spName}: "${text}"`;

    if (currentChars + line.length > TARGET_CHARS && currentLines.length > 0) {
      flush();
      currentLines = [];
      currentChars = 0;
      currentStart = st;
      currentSpeakerLabel = seg.speakerLabel || 'SPEAKER_00';
      currentSpeakerName = seg.speakerDisplayName || 'Speaker';
      currentSpeakerId = seg.speakerId || null;
      currentSegIds = [];
    }

    currentLines.push(line);
    currentChars += line.length;
    currentEnd = et;
    if (seg._id) currentSegIds.push(seg._id.toString());
  }
  if (currentLines.length > 0) flush();

  return chunks;
}

export const embeddingService = {

  /**
   * Full pipeline: segments → chunks → embeddings → MongoDB upsert.
   * Called from the processingWorker in CHUNKING/GENERATING_EMBEDDINGS/INDEXING stages.
   *
   * SECURITY: userId is sourced from the job/worker — NEVER from client input.
   *
   * @param {object} opts
   * @param {string} opts.contentId
   * @param {string} opts.userId
   * @param {string|null} opts.transcriptId
   * @param {Array} opts.segments - Populated TranscriptSegment documents
   * @param {Function} opts.onProgress - Callback({ stage, percent, message })
   * @returns {{ chunksCount: number, embeddingModel: string }}
   */
  async indexContent({ contentId, userId, transcriptId, segments, onProgress = () => {} }) {
    logger.info(`[embeddingService] Starting indexing pipeline for content ${contentId}`, {
      segmentCount: segments?.length || 0
    });

    // ── Stage 1: CHUNKING ─────────────────────────────────────────────────
    onProgress({ stage: 'CHUNKING', percent: 62, message: 'Splitting transcript into semantic chunks' });
    const chunks = buildChunksFromSegments(segments, contentId, transcriptId, userId);

    if (chunks.length === 0) {
      logger.warn(`[embeddingService] No chunks produced for content ${contentId} — skipping indexing`);
      return { chunksCount: 0, embeddingModel: 'heuristic-embedding-v1' };
    }
    logger.info(`[embeddingService] Produced ${chunks.length} chunks for content ${contentId}`);

    // ── Stage 2: GENERATING EMBEDDINGS ────────────────────────────────────
    onProgress({ stage: 'GENERATING_EMBEDDINGS', percent: 72, message: `Generating embeddings for ${chunks.length} chunks` });

    let embeddingModel = 'heuristic-embedding-v1';
    const embeddedChunks = [];

    // Process in batches to respect API rate limits
    for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
      const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE);
      const texts = batch.map((c) => c.text);

      try {
        const { embeddings, model } = await aiService.generateEmbeddings(texts);
        embeddingModel = model;
        batch.forEach((chunk, j) => {
          embeddedChunks.push({ ...chunk, embedding: embeddings[j], embeddingModel: model });
        });
      } catch (err) {
        logger.error(`[embeddingService] Batch embedding failed for batch starting at ${i}: ${err.message}`);
        throw err;
      }

      const batchPercent = 72 + Math.floor((i / chunks.length) * 18);
      onProgress({ stage: 'GENERATING_EMBEDDINGS', percent: batchPercent, message: `Embedded ${Math.min(i + CHUNK_BATCH_SIZE, chunks.length)} / ${chunks.length} chunks` });
    }

    // ── Stage 3: INDEXING ────────────────────────────────────────────────
    onProgress({ stage: 'INDEXING', percent: 90, message: 'Writing vectors to database' });

    // Remove old version chunks first (clean re-index support)
    await embeddingRepository.deleteByContentIdAndVersion(contentId, EMBEDDING_VERSION);
    await embeddingRepository.bulkUpsertChunks(embeddedChunks);

    const finalCount = await embeddingRepository.countByContentId(contentId);
    logger.info(`[embeddingService] Indexed ${finalCount} chunks for content ${contentId} using model ${embeddingModel}`);

    return { chunksCount: finalCount, embeddingModel };
  },

  /**
   * Delete all embeddings for a content item.
   * Called from contentService.deleteContent for cascade cleanup.
   */
  async deleteIndexForContent(contentId) {
    const result = await embeddingRepository.deleteByContentId(contentId);
    logger.info(`[embeddingService] Deleted ${result.deletedCount} embedding chunks for content ${contentId}`);
    return result;
  },

  /**
   * Perform vector search for RAG.
   * SECURITY: userId ownership is ALWAYS enforced — never trust client-supplied contentId alone.
   *
   * @param {number[]} queryEmbedding
   * @param {string} userId
   * @param {string} contentId
   * @param {object} opts - { topK, threshold }
   * @returns {Array} Ranked chunks
   */
  async search(queryEmbedding, userId, contentId, opts = {}) {
    return embeddingRepository.vectorSearch(queryEmbedding, userId, contentId, opts);
  }
};
