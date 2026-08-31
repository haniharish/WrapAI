import { intelligenceService } from '../services/intelligenceService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const intelligenceController = {
  async getIntelligence(req, res) {
    const data = await intelligenceService.getIntelligence(req.params.contentId);
    sendSuccess(res, data, 'Intelligence insights retrieved successfully');
  },

  async updateActionItem(req, res) {
    const { status } = req.body;
    const updated = await intelligenceService.updateActionItemStatus(
      req.params.actionItemId,
      req.user.id,
      status
    );
    sendSuccess(res, updated, 'Action item status updated successfully');
  }
};
