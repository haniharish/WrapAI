import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { userRepository } from '../repositories/userRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString()
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

export const authService = {
  async register({ fullName, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await userRepository.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.USER // Always default to standard USER
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogRepository.createLog({
      userId: user._id,
      action: 'USER_REGISTER',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      metadata: { email: user.email }
    });

    return { user, token, refreshToken };
  },

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Please contact WrapAI support.');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogRepository.createLog({
      userId: user._id,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      metadata: { email: user.email, role: user.role }
    });

    return { user: user.toJSON(), token, refreshToken };
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || user.status === 'SUSPENDED') {
      throw ApiError.unauthorized('User not found or account is suspended');
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return { user: user.toJSON(), token: newToken, refreshToken: newRefreshToken };
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    // Safe response: do not leak account existence
    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been dispatched.' };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    return {
      message: 'Password reset token generated successfully.',
      // In development / demo environment, return token for testing
      ...(config.nodeEnv !== 'production' && { resetToken })
    };
  },

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    const authToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogRepository.createLog({
      userId: user._id,
      action: 'USER_PASSWORD_CHANGE',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      metadata: { action: 'PASSWORD_RESET' }
    });

    return { user: user.toJSON(), token: authToken, refreshToken };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User profile not found');
    return user;
  },

  async logout(userId) {
    if (userId) {
      await auditLogRepository.createLog({
        userId,
        action: 'USER_LOGIN', // record session termination
        resourceType: 'USER',
        resourceId: userId.toString(),
        metadata: { action: 'LOGOUT' }
      });
    }
  }
};
