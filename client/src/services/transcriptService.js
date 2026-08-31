import { apiClient } from './api.js';

export const transcriptService = {
  /**
   * Fetch complete transcript metadata, speakers manifest, and timestamped segments for content
   */
  async getTranscript(contentId) {
    const response = await apiClient.get(`/content/${contentId}/transcript`);
    return response; // unwrap from responseInterceptor -> { success, data: { transcript, speakers, segments } }
  },

  /**
   * Rename a speaker across all segments in this content
   */
  async updateSpeakerName(contentId, speakerLabel, displayName) {
    const response = await apiClient.patch(`/content/${contentId}/speakers`, {
      speakerLabel,
      displayName
    });
    return response;
  }
};
