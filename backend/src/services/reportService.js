import { reportRepository } from '../repositories/reportRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const reportService = {
  async getUserReports(userId, query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { reports, total } = await reportRepository.findByUser(userId, { skip, limit });
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      reports,
      meta: { page, limit, total, totalPages }
    };
  },

  async getReportById(id) {
    const report = await reportRepository.findById(id);
    if (!report) throw ApiError.notFound('Report not found');
    return report;
  }
};
