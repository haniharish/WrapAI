import { mockIntelligence } from '../mocks/mockIntelligence.js';
import { mockDelay, createApiResponse } from './api.js';

let localIntelligence = { ...mockIntelligence };

export const intelligenceService = {
  async getIntelligence(contentId) {
    await mockDelay(250);
    const data = localIntelligence[contentId] || localIntelligence['cnt_01'];
    return createApiResponse(data);
  },

  async updateActionItemStatus(contentId, actionId, newStatus) {
    await mockDelay(200);
    const key = localIntelligence[contentId] ? contentId : 'cnt_01';
    const intel = localIntelligence[key];
    if (intel && intel.actionItems) {
      intel.actionItems = intel.actionItems.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a));
    }
    return createApiResponse(intel.actionItems, 'Action item status updated');
  }
};
