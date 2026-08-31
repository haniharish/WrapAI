import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const authController = {
  async register(req, res) {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'User registration successful', STATUS_CODES.CREATED);
  },

  async login(req, res) {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Authentication successful');
  },

  async getMe(req, res) {
    sendSuccess(res, req.user, 'Current user profile retrieved');
  },

  async logout(req, res) {
    res.clearCookie('token');
    sendSuccess(res, null, 'Logged out successfully');
  }
};
