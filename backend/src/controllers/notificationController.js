import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit, unreadOnly } = req.query;

      const data = await notificationService.getUserNotifications(userId, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        unreadOnly: unreadOnly === 'true'
      });

      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: notification
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: result,
        message: 'All notifications marked as read'
      });
    } catch (err) {
      next(err);
    }
  }
};
