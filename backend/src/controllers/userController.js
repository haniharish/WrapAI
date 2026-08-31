import { userService } from '../services/userService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const userController = {
  async getProfile(req, res) {
    sendSuccess(res, req.user, 'User profile retrieved');
  },

  async updateProfile(req, res) {
    const updated = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, updated, 'Profile updated successfully');
  },

  async changePassword(req, res) {
    const result = await userService.changePassword(req.user.id, req.body);
    sendSuccess(res, result, 'Password changed successfully');
  },

  async deleteAccount(req, res) {
    await userService.deleteAccount(req.user.id);
    sendSuccess(res, null, 'Account deleted successfully');
  }
};
