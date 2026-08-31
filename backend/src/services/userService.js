import { userRepository } from '../repositories/userRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { User } from '../models/User.js';
import { Content } from '../models/Content.js';
import { Transcript } from '../models/Transcript.js';
import { TranscriptSegment } from '../models/TranscriptSegment.js';
import { Speaker } from '../models/Speaker.js';
import { Topic } from '../models/Topic.js';
import { Decision } from '../models/Decision.js';
import { ActionItem } from '../models/ActionItem.js';
import { Analysis } from '../models/Analysis.js';
import { Report } from '../models/Report.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { EmbeddingChunk } from '../models/EmbeddingChunk.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Notification } from '../models/Notification.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const userService = {
  async updateProfile(userId, { fullName, avatar, timezone, preferences }) {
    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (avatar) updates.avatar = avatar;
    if (timezone) updates.timezone = timezone;
    if (preferences) updates.preferences = preferences;

    const updated = await userRepository.updateById(userId, updates);
    if (!updated) throw ApiError.notFound('User not found');

    await auditLogRepository.createLog({
      userId,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: userId.toString(),
      metadata: { fieldsUpdated: Object.keys(updates) }
    });

    return updated;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId, true);
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Incorrect current password');

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await auditLogRepository.createLog({
      userId,
      action: 'USER_PASSWORD_CHANGE',
      resourceType: 'USER',
      resourceId: userId.toString()
    });

    return { success: true, message: 'Password updated successfully' };
  },

  /**
   * Safe cascade deletion of user account and personal assets
   */
  async deleteAccount(userId) {
    logger.info(`[userService] Initiating safe account deletion for user ${userId}`);

    // 1. Find user's personal content IDs
    const personalContent = await Content.find({ userId }).select('_id').exec();
    const contentIds = personalContent.map((c) => c._id);

    // 2. Cascade delete personal AI data
    if (contentIds.length > 0) {
      await Promise.all([
        Content.deleteMany({ _id: { $in: contentIds } }),
        Transcript.deleteMany({ contentId: { $in: contentIds } }),
        TranscriptSegment.deleteMany({ contentId: { $in: contentIds } }),
        Speaker.deleteMany({ contentId: { $in: contentIds } }),
        Topic.deleteMany({ contentId: { $in: contentIds } }),
        Decision.deleteMany({ contentId: { $in: contentIds } }),
        ActionItem.deleteMany({ contentId: { $in: contentIds } }),
        Analysis.deleteMany({ contentId: { $in: contentIds } }),
        Report.deleteMany({ contentId: { $in: contentIds } }),
        EmbeddingChunk.deleteMany({ contentId: { $in: contentIds } }),
        Comment.deleteMany({ contentId: { $in: contentIds } })
      ]);
    }

    // 3. Delete personal chats, notifications, and personal workspace
    await Promise.all([
      ChatSession.deleteMany({ userId }),
      ChatMessage.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Workspace.deleteMany({ ownerId: userId, type: 'PERSONAL' }),
      WorkspaceMember.deleteMany({ userId })
    ]);

    // 4. Delete user record
    await userRepository.deleteById(userId);

    logger.info(`[userService] Account deletion completed for user ${userId}`);
    return { success: true, message: 'Account and personal assets deleted successfully' };
  }
};
