import { mockUsers } from '../mocks/mockUsers.js';
import { mockContent } from '../mocks/mockContent.js';
import { mockProcessingJobs } from '../mocks/mockProcessingJobs.js';
import { mockAnalytics } from '../mocks/mockAnalytics.js';
import { mockDelay, createApiResponse } from './api.js';

export const adminService = {
  async getMetrics() {
    await mockDelay(300);
    return createApiResponse(mockAnalytics.overview);
  },

  async getUsers() {
    await mockDelay(300);
    return createApiResponse(mockUsers);
  },

  async getContentMonitoring() {
    await mockDelay(350);
    return createApiResponse(mockContent);
  },

  async getJobs() {
    await mockDelay(300);
    return createApiResponse(mockProcessingJobs);
  },

  async getAnalytics() {
    await mockDelay(350);
    return createApiResponse(mockAnalytics);
  },

  async getSystemHealth() {
    await mockDelay(250);
    return createApiResponse(mockAnalytics.systemServices);
  }
};
