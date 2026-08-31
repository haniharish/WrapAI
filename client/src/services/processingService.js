import { mockProcessingJobs } from '../mocks/mockProcessingJobs.js';
import { mockDelay, createApiResponse } from './api.js';

export const processingService = {
  async getJobStatus(contentId) {
    await mockDelay(200);
    const job = mockProcessingJobs.find((j) => j.contentId === contentId) || mockProcessingJobs[0];
    return createApiResponse(job);
  }
};
