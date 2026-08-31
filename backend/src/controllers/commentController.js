import { commentService } from '../services/commentService.js';

export const commentController = {
  async createComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { contentId } = req.params;
      const { targetType, targetId, timestampSeconds, text, parentCommentId } = req.body;

      const comment = await commentService.createComment(userId, {
        contentId,
        targetType,
        targetId,
        timestampSeconds,
        text,
        parentCommentId
      });

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async getComments(req, res, next) {
    try {
      const userId = req.user.id;
      const { contentId } = req.params;
      const { targetType, targetId } = req.query;

      const comments = await commentService.getComments(contentId, userId, { targetType, targetId });

      res.json({
        success: true,
        data: comments
      });
    } catch (err) {
      next(err);
    }
  },

  async updateComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;
      const { text } = req.body;

      const updated = await commentService.updateComment(commentId, userId, text);

      res.json({
        success: true,
        data: updated,
        message: 'Comment updated successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;

      const result = await commentService.deleteComment(commentId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
