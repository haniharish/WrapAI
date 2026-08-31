import { analysisRepository } from '../repositories/analysisRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { transcriptRepository } from '../repositories/transcriptRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { processingQueueService } from './processingQueueService.js';
import { ApiError } from '../utils/ApiError.js';

export const intelligenceService = {
  /**
   * Retrieves latest structured intelligence analysis for a content item
   */
  async getAnalysis(contentId) {
    const analysis = await analysisRepository.findLatestByContentId(contentId);
    if (!analysis) {
      // Fallback: check if content already has legacy summary/keypoints
      const content = await contentRepository.findById(contentId);
      if (!content || !content.summary?.short) {
        throw ApiError.notFound('Structured intelligence analysis not found for this content');
      }

      const [topics, decisions, actionItems] = await Promise.all([
        analysisRepository.findTopicsByContentId(contentId),
        analysisRepository.findDecisionsByContentId(contentId),
        analysisRepository.findActionItemsByContentId(contentId)
      ]);

      return {
        contentId: content._id.toString(),
        contentCategory: 'MEETING',
        summary: content.summary,
        keyPoints: content.keyPoints || [],
        highlights: content.highlights || [],
        topics,
        decisions,
        actionItems,
        questions: [],
        llmProvider: 'heuristic',
        llmModel: 'gemini-2.5-flash',
        promptVersion: 'v1.0',
        tokenUsage: { totalTokens: 0 }
      };
    }

    return analysis;
  },

  /**
   * Trigger LLM re-analysis without re-transcribing or re-diarizing
   */
  async triggerReanalysis(contentId, userId) {
    const content = await contentRepository.findById(contentId);
    if (!content) throw ApiError.notFound('Content not found');

    const { transcript } = await transcriptRepository.findByContentId(contentId);
    if (!transcript) {
      throw ApiError.badRequest('Cannot perform analysis without a completed transcript');
    }

    const job = await processingQueueService.enqueueContentProcessing(content._id, userId, {
      jobType: 'REANALYSIS',
      reanalysisOnly: true
    });

    await auditLogRepository.createLog({
      userId,
      action: 'PROCESSING_JOB_ENQUEUED',
      resourceType: 'CONTENT',
      resourceId: contentId.toString(),
      metadata: { action: 'REANALYSIS_REQUESTED', jobId: job.jobId }
    });

    return {
      message: 'Re-analysis job successfully enqueued',
      jobId: job.jobId,
      status: 'QUEUED'
    };
  },

  /**
   * Updates an action item status or details
   */
  async updateActionItem(contentId, userId, itemId, updates) {
    const updated = await analysisRepository.updateActionItem(contentId, itemId, updates);
    if (!updated) {
      throw ApiError.notFound('Action item not found');
    }

    await auditLogRepository.createLog({
      userId,
      action: 'ACTION_ITEM_UPDATED',
      resourceType: 'CONTENT',
      resourceId: contentId.toString(),
      metadata: { itemId, updates }
    });

    return updated;
  },

  /**
   * Updates a decision headline or description
   */
  async updateDecision(contentId, userId, decisionId, updates) {
    const updated = await analysisRepository.updateDecision(contentId, decisionId, updates);
    if (!updated) {
      throw ApiError.notFound('Decision not found');
    }

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_UPDATED',
      resourceType: 'CONTENT',
      resourceId: contentId.toString(),
      metadata: { decisionId, updates }
    });

    return updated;
  }
};
