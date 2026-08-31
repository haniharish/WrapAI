import { intelligenceService } from '../services/intelligenceService.js';
import { ActionItem } from '../models/ActionItem.js';
import { Analysis } from '../models/Analysis.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const intelligenceController = {
  /**
   * GET /api/v1/content/:contentId/analysis OR /api/v1/content/:contentId/intelligence
   */
  async getAnalysis(req, res, next) {
    try {
      const { contentId } = req.params;
      const analysis = await intelligenceService.getAnalysis(contentId);
      return sendSuccess(res, analysis, 'Structured content intelligence retrieved successfully', STATUS_CODES.OK);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Alias for backward compatibility with Phase 3 tests
   */
  async getIntelligence(req, res, next) {
    try {
      const { contentId } = req.params;
      const analysis = await intelligenceService.getAnalysis(contentId);
      return sendSuccess(res, analysis, 'Structured content intelligence retrieved successfully', STATUS_CODES.OK);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/content/:contentId/analyze
   */
  async triggerReanalysis(req, res, next) {
    try {
      const { contentId } = req.params;
      const result = await intelligenceService.triggerReanalysis(contentId, req.user._id);
      return sendSuccess(res, result, result.message, STATUS_CODES.ACCEPTED);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/content/:contentId/action-items/:itemId
   */
  async updateActionItem(req, res, next) {
    try {
      const { contentId, itemId, actionItemId } = req.params;
      const targetId = itemId || actionItemId;

      // If contentId not in params (e.g. /actions/:actionItemId/status)
      if (!contentId) {
        let updated = null;
        try {
          updated = await ActionItem.findByIdAndUpdate(
            targetId,
            { $set: req.body },
            { new: true }
          );
        } catch (e) {
          // ignore cast error
        }

        if (!updated) {
          const analysisDoc = await Analysis.findOne({
            $or: [{ 'actionItems.id': targetId }, { 'actionItems._id': targetId }]
          });
          if (analysisDoc) {
            const item = analysisDoc.actionItems.find((a) => a.id === targetId || a._id?.toString() === targetId);
            if (item) {
              if (req.body.status) item.status = req.body.status;
              if (req.body.task) item.task = req.body.task;
              await analysisDoc.save();
              return sendSuccess(res, item, 'Action item updated successfully', STATUS_CODES.OK);
            }
          }
          throw ApiError.notFound('Action item not found');
        }
        return sendSuccess(res, updated, 'Action item updated successfully', STATUS_CODES.OK);
      }

      const updated = await intelligenceService.updateActionItem(contentId, req.user._id, targetId, req.body);
      return sendSuccess(res, updated, 'Action item updated successfully', STATUS_CODES.OK);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/content/:contentId/decisions/:decisionId
   */
  async updateDecision(req, res, next) {
    try {
      const { contentId, decisionId } = req.params;
      const updated = await intelligenceService.updateDecision(contentId, req.user._id, decisionId, req.body);
      return sendSuccess(res, updated, 'Decision updated successfully', STATUS_CODES.OK);
    } catch (err) {
      next(err);
    }
  }
};
