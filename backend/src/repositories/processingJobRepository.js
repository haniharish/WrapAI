import { ProcessingJob } from '../models/ProcessingJob.js';

export const processingJobRepository = {
  async create(jobData) {
    return ProcessingJob.create(jobData);
  },

  async findById(id) {
    return ProcessingJob.findById(id).exec();
  },

  async findByJobId(jobId) {
    return ProcessingJob.findOne({ jobId }).exec();
  },

  async findByContentId(contentId) {
    return ProcessingJob.find({ contentId }).sort({ createdAt: -1 }).exec();
  },

  async updateStageAndProgress(jobId, stage, progress, status = 'PROCESSING') {
    return ProcessingJob.findOneAndUpdate(
      { jobId },
      { stage, progress, status, updatedAt: new Date() },
      { new: true }
    );
  },

  async markComplete(jobId) {
    return ProcessingJob.findOneAndUpdate(
      { jobId },
      { status: 'COMPLETED', progress: 100, completedAt: new Date() },
      { new: true }
    );
  },

  async markFailed(jobId, error) {
    return ProcessingJob.findOneAndUpdate(
      { jobId },
      { status: 'FAILED', error, completedAt: new Date() },
      { new: true }
    );
  },

  async findAllAdmin({ skip = 0, limit = 20, status = null } = {}) {
    const query = {};
    if (status) query.status = status;

    const [jobs, total] = await Promise.all([
      ProcessingJob.find(query)
        .populate('contentId', 'title contentType')
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProcessingJob.countDocuments(query)
    ]);

    return { jobs, total };
  }
};
