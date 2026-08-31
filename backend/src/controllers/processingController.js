import { processingQueueService } from '../services/processingQueueService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const processingController = {
  async listUserJobs(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const result = await processingQueueService.listUserJobs(userId, req.query);
    sendSuccess(res, result.items, 'Processing jobs retrieved successfully', STATUS_CODES.OK, result.pagination);
  },

  async getJobById(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const job = await processingQueueService.getJobById(req.params.jobId, userId, req.user.role);
    sendSuccess(res, job, 'Processing job retrieved successfully');
  },

  async getJobByContent(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const job = await processingQueueService.getJobByContentId(req.params.contentId, userId, req.user.role);
    sendSuccess(res, job, 'Content processing job retrieved successfully');
  },

  async retryJob(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const job = await processingQueueService.retryJob(req.params.jobId, userId, req.user.role);
    sendSuccess(res, job, 'Processing job re-enqueued successfully');
  },

  async cancelJob(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const job = await processingQueueService.cancelJob(req.params.jobId, userId, req.user.role);
    sendSuccess(res, job, 'Processing job cancelled successfully');
  },

  async adminListJobs(req, res) {
    const result = await processingQueueService.listAllJobsAdmin(req.query);
    sendSuccess(res, result.items, 'All processing jobs retrieved for administration', STATUS_CODES.OK, result.pagination);
  },

  async adminGetMetrics(req, res) {
    const metrics = await processingQueueService.getMetrics();
    sendSuccess(res, metrics, 'Processing queue metrics retrieved');
  }
};
