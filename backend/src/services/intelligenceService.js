import { intelligenceRepository } from '../repositories/intelligenceRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const intelligenceService = {
  async getIntelligence(contentId) {
    const intel = await intelligenceRepository.getIntelligenceByContentId(contentId);
    return intel;
  },

  async updateActionItemStatus(actionItemId, userId, status) {
    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      throw ApiError.badRequest('Status must be PENDING, IN_PROGRESS, or COMPLETED');
    }

    const updated = await intelligenceRepository.updateActionItemStatus(actionItemId, status);
    if (!updated) {
      throw ApiError.notFound('Action item not found');
    }

    await auditLogRepository.createLog({
      userId,
      action: 'ACTION_ITEM_UPDATED',
      resourceType: 'CONTENT',
      resourceId: actionItemId.toString(),
      metadata: { newStatus: status }
    });

    return updated;
  }
};
