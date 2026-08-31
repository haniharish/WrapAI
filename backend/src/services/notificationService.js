import { Notification } from '../models/Notification.js';

export const notificationService = {
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { userId };
    if (unreadOnly) query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false })
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  },

  async markAllAsRead(userId) {
    const res = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return { modifiedCount: res.modifiedCount };
  }
};
