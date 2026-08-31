import { Content } from '../models/Content.js';
import { EmbeddingChunk } from '../models/EmbeddingChunk.js';
import { authorizationService, PERMISSIONS } from './authorizationService.js';
import { aiService } from './aiService.js';
import { cosineSimilarity } from '../repositories/embeddingRepository.js';

export const searchService = {

  /**
   * Search semantically across all accessible workspaces and content items
   */
  async searchSemantic(userId, { query, workspaceId, contentType, speaker, page = 1, limit = 10 }) {
    if (!query || !query.trim()) {
      return { query: '', results: [], total: 0, page, totalPages: 0 };
    }

    // 1. Resolve accessible workspace IDs
    let targetWorkspaceIds = [];
    if (workspaceId) {
      const hasAccess = await authorizationService.canAccessWorkspace(userId, workspaceId, PERMISSIONS.CONTENT_VIEW);
      if (!hasAccess) {
        throw new Error('You do not have permission to search in this workspace');
      }
      targetWorkspaceIds = [workspaceId];
    } else {
      targetWorkspaceIds = await authorizationService.getUserAccessibleWorkspaceIds(userId);
    }

    // 2. Fetch accessible content IDs
    const contentFilter = {
      isDeleted: false,
      $or: [
        { workspaceId: { $in: targetWorkspaceIds } },
        { userId }
      ]
    };
    if (contentType) contentFilter.contentType = contentType;

    const accessibleContent = await Content.find(contentFilter)
      .select('_id title contentType originalFileName mediaDurationSeconds')
      .exec();

    if (accessibleContent.length === 0) {
      return { query, results: [], total: 0, page, totalPages: 0 };
    }

    const contentMap = new Map(
      accessibleContent.map((c) => [c._id.toString(), c])
    );
    const contentIds = Array.from(contentMap.keys());

    // 3. Generate query embedding
    let queryEmbedding = null;
    try {
      const embRes = await aiService.generateEmbeddings([query.trim()]);
      queryEmbedding = embRes.embeddings[0];
    } catch (embErr) {
      queryEmbedding = null;
    }

    // 4. Query embedding chunks
    const chunkFilter = { contentId: { $in: contentIds } };
    if (speaker) chunkFilter.speakerLabel = new RegExp(speaker, 'i');

    const chunks = await EmbeddingChunk.find(chunkFilter).exec();

    let scoredResults = [];

    if (queryEmbedding && chunks.length > 0) {
      // Vector Cosine Similarity Search
      scoredResults = chunks
        .map((chunk) => {
          const score = cosineSimilarity(queryEmbedding, chunk.embedding || []);
          return { chunk, score };
        })
        .filter((item) => item.score >= 0.20)
        .sort((a, b) => b.score - a.score);
    } else {
      // Text fallback search
      const lowerQ = query.toLowerCase();
      scoredResults = chunks
        .filter((chunk) => chunk.text.toLowerCase().includes(lowerQ))
        .map((chunk) => ({ chunk, score: 0.85 }));
    }

    const total = scoredResults.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = scoredResults.slice(offset, offset + limit);

    const formattedResults = paginated.map(({ chunk, score }) => {
      const parentContent = contentMap.get(chunk.contentId.toString()) || {};
      const startTime = chunk.startTime || 0;
      const formattedTime = `${Math.floor(startTime / 60)}:${Math.floor(startTime % 60).toString().padStart(2, '0')}`;

      return {
        chunkId: chunk._id.toString(),
        contentId: chunk.contentId.toString(),
        contentTitle: parentContent.title || 'Meeting Recording',
        contentType: parentContent.contentType || 'AUDIO',
        snippet: chunk.text,
        speaker: chunk.speakerDisplayName || chunk.speakerLabel || 'Speaker',
        startTime,
        endTime: chunk.endTime || 0,
        formattedTime,
        relevanceScore: Math.round(score * 100) / 100,
        jumpUrl: `/content/${chunk.contentId}/transcript?t=${Math.floor(startTime)}`
      };
    });

    return {
      query,
      results: formattedResults,
      total,
      page: Number(page),
      totalPages
    };
  }
};
