// backend/scripts/build_backend_part2.js
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
      select: false // Excluded from query results by default
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
      default: { theme: 'light', emailNotifications: true }
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
        return ret;
      }
    }
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Instance method to compare plain password with hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
`);

// 2. src/models/Content.js
write('src/models/Content.js', `
import mongoose from 'mongoose';
import { CONTENT_TYPES, PROCESSING_STATUS } from '../constants/contentTypes.js';

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    contentType: {
      type: String,
      enum: Object.values(CONTENT_TYPES),
      required: true
    },
    sourceUrl: {
      type: String,
      default: null
    },
    storageKey: {
      type: String,
      default: null
    },
    mediaDurationSeconds: {
      type: Number,
      default: null
    },
    fileSizeBytes: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    processingStatus: {
      type: String,
      enum: Object.values(PROCESSING_STATUS),
      default: PROCESSING_STATUS.UPLOADED,
      index: true
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    processingError: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    hasReport: {
      type: Boolean,
      default: false
    },
    speakersCount: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

contentSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Content = mongoose.model('Content', contentSchema);
`);

// 3. src/models/Report.js
write('src/models/Report.js', `
import mongoose from 'mongoose';
import { REPORT_TYPES } from '../constants/contentTypes.js';

const reportSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true
    },
    contentTitle: {
      type: String,
      default: ''
    },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPES),
      default: REPORT_TYPES.MEETING_MINUTES
    },
    htmlContent: {
      type: String,
      default: ''
    },
    pdfStorageKey: {
      type: String,
      default: null
    },
    docxStorageKey: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'VIEWED'],
      default: 'GENERATED'
    },
    sections: {
      type: [String],
      default: ['Executive Summary', 'Key Decisions', 'Action Items', 'Topics']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

reportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
`);

// 4. Repositories
write('src/repositories/userRepository.js', `
import { User } from '../models/User.js';

export const userRepository = {
  async findById(id, includePassword = false) {
    const q = User.findById(id);
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  },

  async findByEmail(email, includePassword = false) {
    const q = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  },

  async create(userData) {
    return User.create(userData);
  },

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  },

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  },

  async findAll({ skip = 0, limit = 20, search = '', role = null, status = null } = {}) {
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      User.countDocuments(query)
    ]);

    return { users, total };
  }
};
`);

write('src/repositories/contentRepository.js', `
import { Content } from '../models/Content.js';

export const contentRepository = {
  async findById(id) {
    return Content.findOne({ _id: id, isDeleted: false }).exec();
  },

  async create(contentData) {
    return Content.create(contentData);
  },

  async updateById(id, updates) {
    return Content.findOneAndUpdate({ _id: id, isDeleted: false }, updates, { new: true, runValidators: true });
  },

  async softDeleteById(id) {
    return Content.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  },

  async findByUser(userId, { skip = 0, limit = 20, search = '', type = null, status = null, sortBy = 'newest' } = {}) {
    const query = { userId, isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (type && type !== 'ALL') query.contentType = type;
    if (status && status !== 'ALL') query.processingStatus = status;

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'duration') sort = { mediaDurationSeconds: -1 };

    const [items, total] = await Promise.all([
      Content.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Content.countDocuments(query)
    ]);

    return { items, total };
  },

  async findAllAdmin({ skip = 0, limit = 20, search = '', type = null, status = null } = {}) {
    const query = { isDeleted: false };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (type && type !== 'ALL') query.contentType = type;
    if (status && status !== 'ALL') query.processingStatus = status;

    const [items, total] = await Promise.all([
      Content.find(query).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Content.countDocuments(query)
    ]);

    return { items, total };
  }
};
`);

write('src/repositories/reportRepository.js', `
import { Report } from '../models/Report.js';

export const reportRepository = {
  async findById(id) {
    return Report.findById(id).exec();
  },

  async findByUser(userId, { skip = 0, limit = 20 } = {}) {
    const query = { userId };
    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Report.countDocuments(query)
    ]);
    return { reports, total };
  },

  async create(reportData) {
    return Report.create(reportData);
  }
};
`);

// 5. Middlewares
write('src/middlewares/authMiddleware.js', `
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../repositories/userRepository.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Access token is missing or malformed'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await userRepository.findById(decoded.id || decoded.userId);

    if (!user) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists'));
    }

    if (user.status === 'SUSPENDED') {
      return next(ApiError.forbidden('Your account has been suspended. Please contact administration.'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
}
`);

write('src/middlewares/roleMiddleware.js', `
import { ApiError } from '../utils/ApiError.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(\`Access denied: requires \${allowedRoles.join(' or ')} role\`));
    }

    next();
  };
}
`);

write('src/middlewares/ownershipMiddleware.js', `
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

/**
 * Ensures that the authenticated user owns the resource or is an ADMIN.
 */
export function checkOwnership(fetchResourceFn, paramName = 'id') {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await fetchResourceFn(resourceId);

      if (!resource) {
        return next(ApiError.notFound('Resource not found'));
      }

      const resourceOwnerId = resource.userId ? resource.userId.toString() : null;
      const currentUserId = req.user.id.toString();

      if (req.user.role !== ROLES.ADMIN && resourceOwnerId !== currentUserId) {
        return next(ApiError.forbidden('You do not have permission to access or modify this resource'));
      }

      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}
`);

write('src/middlewares/rateLimiter.js', `
import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again later.', 'RATE_LIMIT_EXCEEDED'));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again in 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  }
});
`);

write('src/middlewares/validationMiddleware.js', `
import { ApiError } from '../utils/ApiError.js';

/**
 * Validates request payload against schema definition functions
 */
export function validate(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req.body, req.params, req.query);
    if (errors && Object.keys(errors).length > 0) {
      return next(ApiError.badRequest('Request validation failed', errors));
    }
    next();
  };
}
`);

write('src/middlewares/errorMiddleware.js', `
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { STATUS_CODES, ERROR_CODES } from '../constants/statusCodes.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected server error occurred';
  let errorCode = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let details = err.details || null;

  // Handle Mongoose / MongoDB Specific Errors
  if (err.name === 'CastError') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = \`Invalid format for field: \${err.path}\`;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  } else if (err.code === 11000) {
    statusCode = STATUS_CODES.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = \`Duplicate value entered for \${field}\`;
    errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
  } else if (err.name === 'ValidationError') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = 'Validation Error';
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    details = Object.values(err.errors).map((e) => e.message);
  }

  if (statusCode >= 500) {
    logger.error('Unhandled server error:', { message: err.message, stack: err.stack, path: req.path });
  }

  const errorResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      details: details || {}
    }
  };

  if (config.nodeEnv === 'development' && statusCode >= 500) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req, res, next) {
  res.status(STATUS_CODES.NOT_FOUND).json({
    success: false,
    message: \`Resource not found at \${req.method} \${req.originalUrl}\`,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      details: {}
    }
  });
}
`);

// 6. Validators
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
`);

write('src/validators/userValidators.js', `
export function validateUpdateProfile(body) {
  const errors = {};
  if (body.fullName && body.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  return errors;
}

export function validateChangePassword(body) {
  const errors = {};
  if (!body.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }
  if (!body.newPassword || body.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long';
  }
  return errors;
}
`);

write('src/validators/contentValidators.js', `
export function validateCreateContent(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Content title is required';
  }
  if (!body.contentType) {
    errors.contentType = 'Content type is required';
  }
  return errors;
}

export function validateUpdateContent(body) {
  const errors = {};
  if (body.title !== undefined && body.title.trim().length === 0) {
    errors.title = 'Title cannot be empty';
  }
  return errors;
}
`);

write('src/validators/adminValidators.js', `
export function validateUserStatus(body) {
  const errors = {};
  if (!body.status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(body.status)) {
    errors.status = 'Status must be ACTIVE, SUSPENDED, or INACTIVE';
  }
  return errors;
}
`);

console.log('Backend Part 2 (Models, Repositories, Middlewares, Validators) script written.');
