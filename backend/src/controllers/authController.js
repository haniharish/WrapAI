import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { config } from '../config/environment.js';

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export const authController = {
  async register(req, res) {
    const { user, token, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user, token }, 'User registered successfully', STATUS_CODES.CREATED);
  },

  async login(req, res) {
    const { user, token, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user, token }, 'Authentication successful');
  },

  async refresh(req, res) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { user, token, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
    setRefreshCookie(res, newRefreshToken);
    sendSuccess(res, { user, token }, 'Token refreshed successfully');
  },

  async forgotPassword(req, res) {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result, result.message);
  },

  async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    const { user, token: authToken, refreshToken } = await authService.resetPassword(token, newPassword);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user, token: authToken }, 'Password reset successfully');
  },

  async getMe(req, res) {
    sendSuccess(res, req.user, 'Current authenticated user profile');
  },

  async logout(req, res) {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('token');
    sendSuccess(res, null, 'Logged out successfully');
  }
};
