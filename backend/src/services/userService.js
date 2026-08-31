import { userRepository } from '../repositories/userRepository.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const userService = {
  async updateProfile(userId, { fullName, timezone, preferences }) {
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (timezone) updates.timezone = timezone;
    if (preferences) updates.preferences = preferences;

    const updated = await userRepository.updateById(userId, updates);
    if (!updated) throw ApiError.notFound('User not found');
    return updated;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId, true);
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Incorrect current password');

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();
    return { success: true, message: 'Password updated successfully' };
  },

  async deleteAccount(userId) {
    await userRepository.deleteById(userId);
    return { success: true };
  }
};
