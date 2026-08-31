// backend/scripts/build_phase4_backend.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/backend', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/models/User.js
write('src/models/User.js', `
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ROLES, USER_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    storageUsedBytes: {
      type: Number,
      default: 0
    },
    storageLimitBytes: {
      type: Number,
      default: 5368709120 // 5 GB default
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: { theme: 'light', emailNotifications: true, autoSummarize: true }
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

export const User = mongoose.model('User', userSchema);
`);

// 2. src/services/authService.js
write('src/services/authService.js', `
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
`);

// 3. src/controllers/authController.js
write('src/controllers/authController.js', `
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
`);

// 4. src/validators/authValidators.js
write('src/validators/authValidators.js', `
export function validateRegister(body) {
  const errors = {};
  if (!body.fullName || body.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  if (!body.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(body.email)) {
    errors.email = 'Valid email address is required';
  }
  if (!body.password || body.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  return errors;
}

export function validateLogin(body) {
  const errors = {};
  if (!body.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(body.email)) {
    errors.email = 'Valid email address is required';
  }
  if (!body.password) {
    errors.password = 'Password is required';
  }
  return errors;
}

export function validateForgotPassword(body) {
  const errors = {};
  if (!body.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(body.email)) {
    errors.email = 'Valid email address is required';
  }
  return errors;
}

export function validateResetPassword(body) {
  const errors = {};
  if (!body.token) {
    errors.token = 'Reset token is required';
  }
  if (!body.newPassword || body.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long';
  }
  return errors;
}
`);

// 5. src/routes/auth.routes.js
write('src/routes/auth.routes.js', `
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../validators/authValidators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', authLimiter, validate(validateRegister), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(validateLogin), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/forgot-password', authLimiter, validate(validateForgotPassword), asyncHandler(authController.forgotPassword));
router.post('/reset-password', authLimiter, validate(validateResetPassword), asyncHandler(authController.resetPassword));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
`);

// 6. src/services/userService.js
write('src/services/userService.js', `
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
`);

console.log('Phase 4 Backend Auth Enhancements Generated.');
