import { Comment } from '../models/Comment.js';
import { Content } from '../models/Content.js';
import { Notification } from '../models/Notification.js';
import { authorizationService, PERMISSIONS } from './authorizationService.js';
import { workspaceService } from './workspaceService.js';

export const commentService = {
  /**
   * Add comment to transcript, analysis, or report
   */
  async createComment(userId, { contentId, targetType, targetId, timestampSeconds, text, parentCommentId }) {
    if (!text || !text.trim()) {
      throw new Error('Comment text cannot be empty');
    }

    const content = await Content.findById(contentId).exec();
    if (!content || content.isDeleted) {
      throw new Error('Content not found');
    }

    const canComment = await authorizationService.canAccessContent(userId, contentId, PERMISSIONS.COMMENT_CREATE);
    if (!canComment) {
      throw new Error('You do not have permission to comment on this content');
    }

    // Determine workspace ID (fallback to user's personal space if unassigned)
    let workspaceId = content.workspaceId;
    if (!workspaceId) {
      const personal = await workspaceService.ensurePersonalWorkspace(content.userId);
      workspaceId = personal._id;
    }

    const comment = await Comment.create({
      userId,
      workspaceId,
      contentId,
      targetType: targetType || 'TRANSCRIPT',
      targetId: targetId || null,
      timestampSeconds: timestampSeconds !== undefined ? timestampSeconds : null,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    });

    // Notify parent comment author on reply
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).exec();
      if (parentComment && parentComment.userId.toString() !== userId.toString()) {
        await Notification.create({
          userId: parentComment.userId,
          workspaceId,
          type: 'COMMENT_REPLY',
          title: 'New Reply on Comment',
          message: `Someone replied to your comment on "${content.title}".`,
          resourceType: 'CONTENT',
          resourceId: contentId
        });
      }
    }

    return Comment.findById(comment._id)
      .populate('userId', 'fullName email avatar')
      .exec();
  },

  /**
   * Get comments for a content item
   */
  async getComments(contentId, userId, filters = {}) {
    const canView = await authorizationService.canAccessContent(userId, contentId, PERMISSIONS.COMMENT_VIEW);
    if (!canView) {
      throw new Error('You do not have permission to view comments for this content');
    }

    const query = { contentId };
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.targetId) query.targetId = filters.targetId;

    return Comment.find(query)
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: 1 })
      .exec();
  },

  /**
   * Update own comment
   */
  async updateComment(commentId, userId, text) {
    const comment = await Comment.findById(commentId).exec();
    if (!comment) throw new Error('Comment not found');

    if (comment.userId.toString() !== userId.toString()) {
      throw new Error('You can only edit your own comments');
    }

    comment.text = text.trim();
    await comment.save();

    return Comment.findById(commentId)
      .populate('userId', 'fullName email avatar')
      .exec();
  },

  /**
   * Delete comment (Author or Workspace Admin/Owner)
   */
  async deleteComment(commentId, userId) {
    const comment = await Comment.findById(commentId).exec();
    if (!comment) throw new Error('Comment not found');

    const isAuthor = comment.userId.toString() === userId.toString();
    const canModerate = await authorizationService.canAccessWorkspace(userId, comment.workspaceId, PERMISSIONS.COMMENT_DELETE);

    if (!isAuthor && !canModerate) {
      throw new Error('You do not have permission to delete this comment');
    }

    await Promise.all([
      Comment.findByIdAndDelete(commentId),
      Comment.deleteMany({ parentCommentId: commentId })
    ]);

    return { message: 'Comment deleted successfully' };
  }
};
