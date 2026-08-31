import { apiClient } from './api.js';

export const adminService = {
  async getMetrics() {
    return apiClient.get('/admin/overview');
  },

  async getUsers() {
    return apiClient.get('/admin/users');
  },

  async updateUserStatus(userId, status) {
    return apiClient.patch(`/admin/users/${userId}/status`, { status });
  },

  async getContentMonitoring() {
    return apiClient.get('/admin/content');
  },

  async getJobs() {
    return apiClient.get('/admin/processing');
  },

  async getAnalytics() {
    return apiClient.get('/admin/analytics');
  },

  async getSystemHealth() {
    return apiClient.get('/admin/system');
  }
};
