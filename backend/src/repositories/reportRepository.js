import { Report } from '../models/Report.js';

export const reportRepository = {
  async findById(id) {
    return Report.findById(id).exec();
  },

  async findByIdAndUserId(id, userId) {
    return Report.findOne({ _id: id, userId }).exec();
  },

  async findByUser(userId, { skip = 0, limit = 20, contentId = null, format = null } = {}) {
    const query = { userId };
    if (contentId) query.contentId = contentId;
    if (format) query.format = format.toUpperCase();

    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Report.countDocuments(query)
    ]);
    return { reports, total };
  },

  async findByContentId(contentId, userId = null) {
    const query = { contentId };
    if (userId) query.userId = userId;
    return Report.find(query).sort({ version: -1, createdAt: -1 }).exec();
  },

  async findLatestByContentId(contentId, userId) {
    return Report.findOne({ contentId, userId }).sort({ version: -1, createdAt: -1 }).exec();
  },

  async findByShareToken(shareToken) {
    if (!shareToken) return null;
    return Report.findOne({
      shareToken,
      isShared: true,
      $or: [
        { shareExpiresAt: null },
        { shareExpiresAt: { $gt: new Date() } }
      ]
    }).exec();
  },

  async create(reportData) {
    return Report.create(reportData);
  },

  async updateById(id, updateData) {
    return Report.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  },

  async deleteById(id) {
    return Report.findByIdAndDelete(id).exec();
  },

  async deleteByContentId(contentId) {
    return Report.deleteMany({ contentId }).exec();
  }
};
