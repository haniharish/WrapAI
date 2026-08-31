import { AuditLog } from '../models/AuditLog.js';

export const auditLogRepository = {
  async createLog(logData) {
    return AuditLog.create(logData);
  },

  async findByUser(userId, { skip = 0, limit = 20 } = {}) {
    const [logs, total] = await Promise.all([
      AuditLog.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AuditLog.countDocuments({ userId })
    ]);
    return { logs, total };
  },

  async findAllAdmin({ skip = 0, limit = 50, action = null } = {}) {
    const query = {};
    if (action) query.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AuditLog.countDocuments(query)
    ]);

    return { logs, total };
  }
};
