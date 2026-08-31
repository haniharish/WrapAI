import { mockContent } from '../mocks/mockContent.js';
import { mockDelay, createApiResponse, createApiError } from './api.js';

let localContentStore = [...mockContent];

export const contentService = {
  async getContentList({ search = '', type = 'ALL', status = 'ALL', sortBy = 'newest' } = {}) {
    await mockDelay(300);
    let results = [...localContentStore];

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) => c.title.toLowerCase().includes(q) || c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (type !== 'ALL') {
      results = results.filter((c) => c.contentType === type);
    }

    if (status !== 'ALL') {
      results = results.filter((c) => c.processingStatus === status);
    }

    if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'duration') {
      results.sort((a, b) => (b.mediaDurationSeconds || 0) - (a.mediaDurationSeconds || 0));
    }

    return createApiResponse(results, 'Content retrieved successfully', { total: results.length });
  },

  async getContentById(id) {
    await mockDelay(250);
    const item = localContentStore.find((c) => c.id === id);
    if (!item) {
      createApiError('CONTENT_NOT_FOUND', `Content with ID ${id} was not found`);
    }
    return createApiResponse(item);
  },

  async uploadContent(payload) {
    await mockDelay(600);
    const newContent = {
      id: `cnt_${Date.now()}`,
      userId: 'usr_01',
      title: payload.title || payload.file?.name || 'Untitled Upload',
      description: payload.description || 'Uploaded media file.',
      contentType: payload.type || 'AUDIO',
      sourceUrl: payload.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      mediaDurationSeconds: 1800, // 30 min estimate
      fileSizeBytes: payload.file?.size || 35000000,
      mimeType: payload.file?.type || 'audio/mp3',
      processingStatus: 'QUEUED',
      processingProgress: 0,
      hasReport: false,
      tags: payload.tags || ['Upload', 'Ingested'],
      speakersCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localContentStore.unshift(newContent);
    return createApiResponse(newContent, 'File uploaded and enqueued for processing');
  },

  async updateContent(id, updates) {
    await mockDelay(250);
    const idx = localContentStore.findIndex((c) => c.id === id);
    if (idx === -1) createApiError('NOT_FOUND', 'Item not found');
    localContentStore[idx] = { ...localContentStore[idx], ...updates, updatedAt: new Date().toISOString() };
    return createApiResponse(localContentStore[idx], 'Content updated successfully');
  },

  async deleteContent(id) {
    await mockDelay(300);
    localContentStore = localContentStore.filter((c) => c.id !== id);
    return createApiResponse({ id }, 'Content removed successfully');
  }
};
