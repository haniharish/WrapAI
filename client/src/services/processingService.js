import apiClient from './api.js';

export const processingService = {
  /**
   * Get single processing job details by jobId or recordId
   */
  async getJobStatus(jobId) {
    const response = await apiClient.get(`/processing/${jobId}`);
    return response.data;
  },

  /**
   * Get active/latest processing job for a given content item
   */
  async getContentProcessingStatus(contentId) {
    const response = await apiClient.get(`/content/${contentId}/processing`);
    return response.data;
  },

  /**
   * List paginated processing jobs for the current user
   */
  async getUserProcessingJobs(params = {}) {
    const response = await apiClient.get('/processing', { params });
    return response.data;
  },

  /**
   * Retry a failed or cancelled processing job
   */
  async retryProcessingJob(jobId) {
    const response = await apiClient.post(`/processing/${jobId}/retry`);
    return response.data;
  },

  /**
   * Cancel an active or queued processing job
   */
  async cancelProcessingJob(jobId) {
    const response = await apiClient.post(`/processing/${jobId}/cancel`);
    return response.data;
  },

  /**
   * Admin: Fetch queue metrics and database breakdown
   */
  async getAdminQueueMetrics() {
    const response = await apiClient.get('/processing/metrics');
    return response.data;
  },

  /**
   * Admin: List all processing jobs across all users
   */
  async getAdminAllJobs(params = {}) {
    const response = await apiClient.get('/processing/admin/all', { params });
    return response.data;
  }
};
