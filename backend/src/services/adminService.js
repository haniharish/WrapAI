import { userRepository } from '../repositories/userRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { User } from '../models/User.js';
import { Content } from '../models/Content.js';
import { ApiError } from '../utils/ApiError.js';

export const adminService = {
  async getMetricsOverview() {
    const [totalUsers, totalContent, activeUsers] = await Promise.all([
      User.countDocuments(),
      Content.countDocuments({ isDeleted: false }),
      User.countDocuments({ status: 'ACTIVE' })
    ]);

    return {
      totalUsers,
      totalContent,
      activeJobs: 2,
      completedJobs: totalContent,
      failedJobs: 0,
      aiRequests: totalContent * 32,
      totalStorageBytes: 1048576000,
      estimatedCostUsd: 14.50,
      systemHealth: 'HEALTHY'
    };
  },

  async getAllUsers(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { users, total } = await userRepository.findAll({
      skip,
      limit,
      search: query.search || '',
      role: query.role || null,
      status: query.status || null
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { users, meta: { page, limit, total, totalPages } };
  },

  async updateUserStatus(userId, status) {
    const updated = await userRepository.updateById(userId, { status });
    if (!updated) throw ApiError.notFound('User not found');
    return updated;
  },

  async getAllContent(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await contentRepository.findAllAdmin({
      skip,
      limit,
      search: query.search || '',
      type: query.type || null,
      status: query.status || null
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { items, meta: { page, limit, total, totalPages } };
  },

  async getQueueTelemetry() {
    return [
      {
        id: 'job_10495',
        contentTitle: 'Keynote Ingestion',
        stage: 'TRANSCRIPTION',
        progress: 68,
        status: 'Processing',
        startedAt: new Date().toISOString()
      }
    ];
  },

  async getAnalytics() {
    return {
      dailyUploads: [
        { date: 'Aug 29', uploads: 14 },
        { date: 'Aug 30', uploads: 22 },
        { date: 'Aug 31', uploads: 35 }
      ],
      contentTypesBreakdown: [
        { type: 'Meetings', percentage: 50 },
        { type: 'Lectures', percentage: 30 },
        { type: 'Documents', percentage: 20 }
      ]
    };
  },

  async getSystemHealth() {
    return [
      { name: 'API Gateway', status: 'ONLINE', latencyMs: 15, uptime: '99.99%' },
      { name: 'MongoDB Atlas', status: 'ONLINE', latencyMs: 12, uptime: '99.99%' },
      { name: 'Storage Ingress', status: 'ONLINE', latencyMs: 35, uptime: '100%' }
    ];
  }
};
