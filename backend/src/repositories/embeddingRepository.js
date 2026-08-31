import mongoose from 'mongoose';
import { EmbeddingChunk } from '../models/EmbeddingChunk.js';
import { logger } from '../utils/logger.js';

/**
 * Cosine similarity for in-memory vector search fallback.
 * @param {number[]} a
 * @param {number[]} b
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const embeddingRepository = {

  /**
   * Upsert a batch of EmbeddingChunk documents (idempotent).
   * Uses compound unique index: contentId + chunkIndex + embeddingVersion.
   */
  async bulkUpsertChunks(chunks) {
    if (!chunks || chunks.length === 0) return;
    const ops = chunks.map((chunk) => ({
      updateOne: {
        filter: {
          contentId: chunk.contentId,
          chunkIndex: chunk.chunkIndex,
          embeddingVersion: chunk.embeddingVersion || 'v1'
        },
        update: { $set: chunk },
        upsert: true
      }
    }));
    return EmbeddingChunk.bulkWrite(ops, { ordered: false });
  },

  /**
   * Delete all EmbeddingChunks for a content item (on content deletion or re-index).
   */
  async deleteByContentId(contentId) {
    return EmbeddingChunk.deleteMany({ contentId: new mongoose.Types.ObjectId(contentId) });
  },

  /**
   * Delete a specific embedding version for a content item (for re-indexing).
   */
  async deleteByContentIdAndVersion(contentId, embeddingVersion) {
    return EmbeddingChunk.deleteMany({
      contentId: new mongoose.Types.ObjectId(contentId),
      embeddingVersion
    });
  },

  /**
   * Count chunks for a content item.
   */
  async countByContentId(contentId) {
    return EmbeddingChunk.countDocuments({ contentId: new mongoose.Types.ObjectId(contentId) });
  },

  /**
   * Get chunk texts for a content item (for embedding generation).
   */
  async findChunksByContentId(contentId) {
    return EmbeddingChunk.find({ contentId: new mongoose.Types.ObjectId(contentId) })
      .sort({ chunkIndex: 1 })
      .lean();
  },

  /**
   * Semantic vector search with ownership enforcement.
   *
   * Tries MongoDB Atlas $vectorSearch first.
   * Falls back to in-memory cosine similarity (for local dev / test environments).
   *
   * SECURITY: contentIds are ALWAYS restricted to those owned by userId.
   * Vector similarity is NOT the security boundary — ownership is enforced separately.
   *
   * @param {number[]} queryEmbedding - Embedding of user query.
   * @param {string} userId - Authenticated user ID (from req.user.id).
   * @param {string} contentId - Specific content to search within.
   * @param {object} opts
   * @param {number} opts.topK - Max results to return (default 8).
   * @param {number} opts.threshold - Minimum similarity score (default 0.35).
   * @param {string} opts.embeddingVersion - Embedding version filter.
   * @returns {Array} Scored chunks sorted by relevance.
   */
  async vectorSearch(queryEmbedding, userId, contentId, opts = {}) {
    const { topK = 8, threshold = 0.35, embeddingVersion = 'v1' } = opts;

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const contentIdObj = new mongoose.Types.ObjectId(contentId);

    // Try Atlas $vectorSearch pipeline
    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: 'embedding_vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 10,
            limit: topK,
            filter: {
              contentId: contentIdObj,
              userId: userIdObj
            }
          }
        },
        {
          $addFields: {
            score: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $match: { score: { $gte: threshold } }
        },
        {
          $project: {
            embedding: 0 // Never return raw vectors to Node layer
          }
        }
      ];

      const results = await EmbeddingChunk.aggregate(pipeline);
      logger.info(`[embeddingRepository] Atlas vectorSearch returned ${results.length} chunks`, {
        contentId: contentId.toString(), topK
      });
      return results;
    } catch (atlasErr) {
      // Atlas vector search unavailable (local dev / test env without Atlas) — use fallback
      if (atlasErr.message?.includes('$vectorSearch') || atlasErr.message?.includes('PlanExecutor')) {
        logger.warn('[embeddingRepository] Atlas $vectorSearch unavailable, using in-memory cosine fallback');
        return this._inmemoryCosineFallback(
          queryEmbedding, userIdObj, contentIdObj, topK, threshold, embeddingVersion
        );
      }
      throw atlasErr;
    }
  },

  /**
   * In-memory cosine similarity fallback for environments without Atlas Vector Search.
   * Loads all chunk embeddings for the content and scores them locally.
   */
  async _inmemoryCosineFallback(queryEmbedding, userIdObj, contentIdObj, topK, threshold, embeddingVersion) {
    const chunks = await EmbeddingChunk.find({
      contentId: contentIdObj,
      userId: userIdObj
    })
      .select('+embedding') // Include the normally-excluded embedding field
      .lean();

    if (!chunks.length) return [];

    const scored = chunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding || [])
      }))
      .filter((c) => c.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((c) => {
        const { embedding: _emb, ...rest } = c;
        return rest; // Strip raw embedding from result
      });

    logger.info(`[embeddingRepository] In-memory fallback returned ${scored.length} chunks`);
    return scored;
  }
};
