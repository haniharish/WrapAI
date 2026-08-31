import { UsageRecord } from '../models/UsageRecord.js';
import { Workspace } from '../models/Workspace.js';
import { logger } from '../utils/logger.js';

export const usageService = {
  /**
   * Increment metric usage for a workspace
   */
  async trackIncrement(workspaceId, userId, metric, amount = 1) {
    if (!workspaceId || !metric) return null;
    const period = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    try {
      return await UsageRecord.findOneAndUpdate(
        { workspaceId, metric, period },
        {
          $inc: { amount },
          $setOnInsert: { userId }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.warn(`[usageService] Failed to track metric ${metric}:`, err.message);
      return null;
    }
  },

  /**
   * Get all metric totals for a workspace in the current period
   */
  async getWorkspaceUsage(workspaceId, period = new Date().toISOString().slice(0, 7)) {
    const records = await UsageRecord.find({ workspaceId, period }).exec();
    const usageMap = {};

    records.forEach((r) => {
      usageMap[r.metric] = r.amount;
    });

    const workspace = await Workspace.findById(workspaceId).exec();

    return {
      period,
      plan: workspace?.plan || 'FREE',
      usage: {
        uploads: usageMap.UPLOADS_COUNT || 0,
        storageBytes: usageMap.STORAGE_BYTES || 0,
        mediaMinutes: usageMap.MEDIA_MINUTES || 0,
        aiAnalyses: usageMap.LLM_ANALYSIS_COUNT || 0,
        embeddings: usageMap.EMBEDDINGS_COUNT || 0,
        ragQueries: usageMap.RAG_QUERIES_COUNT || 0,
        reports: usageMap.REPORTS_COUNT || 0
      },
      limits: {
        maxStorageBytes: workspace?.settings?.maxStorageBytes || 5368709120,
        maxTranscriptionMinutes: workspace?.settings?.maxTranscriptionMinutes || 300
      }
    };
  }
};
