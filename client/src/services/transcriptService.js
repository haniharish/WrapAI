import { apiClient } from './api.js';

export const transcriptService = {
  /**
   * Fetch complete transcript metadata, speakers manifest, and timestamped segments for content
   */
  async getTranscript(contentId) {
    const response = await apiClient.get(`/content/${contentId}/transcript`);
    return response;
  },

  /**
   * Fetch detected speakers list with speaking statistics for content
   */
  async getSpeakers(contentId) {
    const response = await apiClient.get(`/content/${contentId}/speakers`);
    return response;
  },

  /**
   * Rename a speaker across all segments in this content by speakerLabel
   */
  async updateSpeakerName(contentId, speakerLabel, displayName) {
    const response = await apiClient.patch(`/content/${contentId}/speakers`, {
      speakerLabel,
      displayName
    });
    return response;
  },

  /**
   * Rename a speaker by speakerId
   */
  async updateSpeakerById(speakerId, displayName) {
    const response = await apiClient.patch(`/speakers/${speakerId}`, {
      displayName
    });
    return response;
  }
};
