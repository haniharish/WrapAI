import { reportService } from '../services/reportService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const reportController = {
  async list(req, res) {
    const { reports, meta } = await reportService.getUserReports(req.user.id, req.query);
    sendSuccess(res, reports, 'Reports retrieved successfully', 200, meta);
  },

  async getById(req, res) {
    sendSuccess(res, req.resource, 'Report details retrieved');
  }
};
