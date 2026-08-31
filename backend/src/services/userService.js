import { userRepository } from '../repositories/userRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

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
      action: 'USER_LOGIN', // general profile update
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

  async deleteAccount(userId) {
    await userRepository.deleteById(userId);
    return { success: true };
  }
};
