import apiClient from './api.js';

export const collaborationService = {
  // Comments
  async getComments(contentId, filters = {}) {
    return apiClient.get(`/content/${contentId}/comments`, { params: filters });
  },

  async createComment(contentId, data) {
    return apiClient.post(`/content/${contentId}/comments`, data);
  },

  async updateComment(commentId, text) {
    return apiClient.put(`/comments/${commentId}`, { text });
  },

  async deleteComment(commentId) {
    return apiClient.delete(`/comments/${commentId}`);
  },

  // Notifications
  async getNotifications(params = {}) {
    return apiClient.get('/notifications', { params });
  },

  async markNotificationRead(id) {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead() {
    return apiClient.post('/notifications/read-all');
  },

  // Global Semantic Search
  async globalSearch(query, filters = {}) {
    return apiClient.get('/search', {
      params: {
        q: query,
        ...filters
      }
    });
  }
};
