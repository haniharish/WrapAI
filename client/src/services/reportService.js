import apiClient from './api.js';

export const reportService = {
  /**
   * List all reports for the current user (paginated)
   */
  async getReports(query = {}) {
    return apiClient.get('/reports', { params: query });
  },

  /**
   * List all generated report versions for a content item
   */
  async getContentReports(contentId) {
    return apiClient.get(`/content/${contentId}/reports`);
  },

  /**
   * Real-time preview of structured report data
   */
  async previewReport(contentId, payload = {}) {
    return apiClient.post(`/content/${contentId}/reports/preview`, payload);
  },

  /**
   * Trigger generation of a new report document (PDF, DOCX, Markdown, TXT)
   */
  async generateReport(contentId, payload = {}) {
    return apiClient.post(`/content/${contentId}/reports`, payload);
  },

  /**
   * Fetch single report metadata
   */
  async getReportById(reportId) {
    return apiClient.get(`/reports/${reportId}`);
  },

  /**
   * Regenerate report into a new version
   */
  async regenerateReport(reportId, overrides = {}) {
    return apiClient.post(`/reports/${reportId}/regenerate`, overrides);
  },

  /**
   * Delete report document and record
   */
  async deleteReport(reportId) {
    return apiClient.delete(`/reports/${reportId}`);
  },

  /**
   * Create public shareable read-only link
   */
  async shareReport(reportId, opts = { expiresInDays: 7 }) {
    return apiClient.post(`/reports/${reportId}/share`, opts);
  },

  /**
   * Revoke public share link
   */
  async revokeShare(reportId) {
    return apiClient.delete(`/reports/${reportId}/share`);
  },

  /**
   * View read-only public report by share token
   */
  async getSharedReport(shareToken) {
    return apiClient.get(`/reports/shared/${shareToken}`);
  },

  /**
   * Authenticated file download trigger
   */
  async downloadReport(reportId, filename = 'report.pdf') {
    const token = localStorage.getItem('wrapai_token');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(err.message || 'Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
