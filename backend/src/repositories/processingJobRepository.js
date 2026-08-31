import mongoose from 'mongoose';
import { ProcessingJob } from '../models/ProcessingJob.js';

export const processingJobRepository = {
  async findById(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return ProcessingJob.findById(id).exec();
  },

  async findByJobId(jobId) {
    if (!jobId) return null;
    return ProcessingJob.findOne({ jobId }).exec();
  },

  async findActiveByContentId(contentId) {
    if (!contentId || !mongoose.isValidObjectId(contentId)) return null;
    return ProcessingJob.findOne({
      contentId,
      status: { $in: ['QUEUED', 'PROCESSING'] }
    }).sort({ createdAt: -1 }).exec();
  },

  async findLatestByContentId(contentId) {
    if (!contentId || !mongoose.isValidObjectId(contentId)) return null;
    return ProcessingJob.findOne({ contentId }).sort({ createdAt: -1 }).exec();
  },

  async create(jobData) {
    return ProcessingJob.create(jobData);
  },

  async updateById(id, updates) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return ProcessingJob.findByIdAndUpdate(id, updates, { new: true });
  },

  async updateByJobId(jobId, updates) {
    if (!jobId) return null;
    return ProcessingJob.findOneAndUpdate({ jobId }, updates, { new: true });
  },

  async findUserJobs(userId, { skip = 0, limit = 20, status = null } = {}) {
    const query = { userId };
    if (status && status !== 'ALL') {
      query.status = status;
    }
    const [items, total] = await Promise.all([
      ProcessingJob.find(query).populate('contentId', 'title contentType fileSizeBytes').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ProcessingJob.countDocuments(query)
    ]);
    return { items, total };
  },

  async findAllAdmin({ skip = 0, limit = 20, status = null } = {}) {
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    const [items, total] = await Promise.all([
      ProcessingJob.find(query)
        .populate('userId', 'fullName email')
        .populate('contentId', 'title contentType fileSizeBytes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProcessingJob.countDocuments(query)
    ]);
    return { items, total };
  }
};
