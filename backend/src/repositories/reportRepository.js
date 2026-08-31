import { Report } from '../models/Report.js';

export const reportRepository = {
  async findById(id) {
    return Report.findById(id).exec();
  },

  async findByUser(userId, { skip = 0, limit = 20 } = {}) {
    const query = { userId };
    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Report.countDocuments(query)
    ]);
    return { reports, total };
  },

  async create(reportData) {
    return Report.create(reportData);
  }
};
