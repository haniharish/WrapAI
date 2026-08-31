import { apiClient } from './api.js';

export const contentService = {
  /**
   * Fetch paginated list of user content
   */
  async getContentList({ page = 1, limit = 20, search = '', type = 'ALL', status = 'ALL', sortBy = 'newest' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (type && type !== 'ALL') params.append('type', type);
    if (status && status !== 'ALL') params.append('status', status);
    if (sortBy) params.append('sort', sortBy);

    return apiClient.get(`/content?${params.toString()}`);
  },

  /**
   * Fetch single content details by ID
   */
  async getContentById(id) {
    return apiClient.get(`/content/${id}`);
  },

  /**
   * Upload binary audio/video/document file with multipart/form-data
   */
  async uploadFile({ file, title, description, tags, language }, onProgress = null, signal = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    if (language) formData.append('language', language);

    return apiClient.post('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
      signal
    });
  },

  /**
   * Ingest raw verbatim text
   */
  async submitText({ title, text, description, tags, language }) {
    return apiClient.post('/content/text', {
      title,
      text,
      description,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      language
    });
  },

  /**
   * Ingest media link / remote URL
   */
  async submitUrl({ title, url, description, tags, language }) {
    return apiClient.post('/content/url', {
      title,
      url,
      description,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      language
    });
  },

  /**
   * Legacy upload adapter for backwards compatibility with UI components
   */
  async uploadContent(payload, onProgress = null, signal = null) {
    if (payload.type === 'TEXT') {
      return this.submitText({
        title: payload.title,
        text: payload.rawText || payload.text,
        description: payload.description,
        tags: payload.tags,
        language: payload.language
      });
    }
    if (payload.type === 'LINK' || payload.type === 'URL') {
      return this.submitUrl({
        title: payload.title,
        url: payload.url,
        description: payload.description,
        tags: payload.tags,
        language: payload.language
      });
    }
    return this.uploadFile(payload, onProgress, signal);
  },

  /**
   * Rename / update content title, description, or tags
   */
  async updateContent(id, updates) {
    return apiClient.patch(`/content/${id}`, updates);
  },

  /**
   * Soft-delete content and release S3 storage
   */
  async deleteContent(id) {
    return apiClient.delete(`/content/${id}`);
  },

  /**
   * Fetch secure temporary presigned access URL
   */
  async getAccessUrl(id) {
    return apiClient.get(`/content/${id}/access`);
  }
};
