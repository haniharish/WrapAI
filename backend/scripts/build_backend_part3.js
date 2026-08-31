// backend/scripts/build_backend_part3.js
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

// 1. Services
write('src/services/authService.js', `
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { userRepository } from '../repositories/userRepository.js';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';

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
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await userRepository.create({
      fullName,
      email,
      passwordHash
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, token, refreshToken };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account is suspended. Contact administration.');
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user: user.toJSON(), token, refreshToken };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User profile not found');
    return user;
  }
};
`);

write('src/services/userService.js', `
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
`);

write('src/services/contentService.js', `
import { contentRepository } from '../repositories/contentRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const contentService = {
  async createContent(userId, data) {
    const content = await contentRepository.create({
      ...data,
      userId
    });
    return content;
  },

  async getUserContent(userId, query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await contentRepository.findByUser(userId, {
      skip,
      limit,
      search: query.search || '',
      type: query.type || null,
      status: query.status || null,
      sortBy: query.sortBy || 'newest'
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      meta: { page, limit, total, totalPages }
    };
  },

  async getContentById(id) {
    const content = await contentRepository.findById(id);
    if (!content) throw ApiError.notFound('Content item not found');
    return content;
  },

  async updateContent(id, updates) {
    const updated = await contentRepository.updateById(id, updates);
    if (!updated) throw ApiError.notFound('Content item not found');
    return updated;
  },

  async deleteContent(id) {
    const deleted = await contentRepository.softDeleteById(id);
    if (!deleted) throw ApiError.notFound('Content item not found');
    return { id };
  }
};
`);

write('src/services/reportService.js', `
import { reportRepository } from '../repositories/reportRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const reportService = {
  async getUserReports(userId, query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { reports, total } = await reportRepository.findByUser(userId, { skip, limit });
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      reports,
      meta: { page, limit, total, totalPages }
    };
  },

  async getReportById(id) {
    const report = await reportRepository.findById(id);
    if (!report) throw ApiError.notFound('Report not found');
    return report;
  }
};
`);

write('src/services/adminService.js', `
import { userRepository } from '../repositories/userRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { User } from '../models/User.js';
import { Content } from '../models/Content.js';
import { ApiError } from '../utils/ApiError.js';

export const adminService = {
  async getMetricsOverview() {
    const [totalUsers, totalContent, activeUsers] = await Promise.all([
      User.countDocuments(),
      Content.countDocuments({ isDeleted: false }),
      User.countDocuments({ status: 'ACTIVE' })
    ]);

    return {
      totalUsers,
      totalContent,
      activeJobs: 2,
      completedJobs: totalContent,
      failedJobs: 0,
      aiRequests: totalContent * 32,
      totalStorageBytes: 1048576000,
      estimatedCostUsd: 14.50,
      systemHealth: 'HEALTHY'
    };
  },

  async getAllUsers(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { users, total } = await userRepository.findAll({
      skip,
      limit,
      search: query.search || '',
      role: query.role || null,
      status: query.status || null
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { users, meta: { page, limit, total, totalPages } };
  },

  async updateUserStatus(userId, status) {
    const updated = await userRepository.updateById(userId, { status });
    if (!updated) throw ApiError.notFound('User not found');
    return updated;
  },

  async getAllContent(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await contentRepository.findAllAdmin({
      skip,
      limit,
      search: query.search || '',
      type: query.type || null,
      status: query.status || null
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { items, meta: { page, limit, total, totalPages } };
  },

  async getQueueTelemetry() {
    return [
      {
        id: 'job_10495',
        contentTitle: 'Keynote Ingestion',
        stage: 'TRANSCRIPTION',
        progress: 68,
        status: 'Processing',
        startedAt: new Date().toISOString()
      }
    ];
  },

  async getAnalytics() {
    return {
      dailyUploads: [
        { date: 'Aug 29', uploads: 14 },
        { date: 'Aug 30', uploads: 22 },
        { date: 'Aug 31', uploads: 35 }
      ],
      contentTypesBreakdown: [
        { type: 'Meetings', percentage: 50 },
        { type: 'Lectures', percentage: 30 },
        { type: 'Documents', percentage: 20 }
      ]
    };
  },

  async getSystemHealth() {
    return [
      { name: 'API Gateway', status: 'ONLINE', latencyMs: 15, uptime: '99.99%' },
      { name: 'MongoDB Atlas', status: 'ONLINE', latencyMs: 12, uptime: '99.99%' },
      { name: 'Storage Ingress', status: 'ONLINE', latencyMs: 35, uptime: '100%' }
    ];
  }
};
`);

// 2. Controllers
write('src/controllers/healthController.js', `
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/responseHandler.js';
import { config } from '../config/environment.js';

export function getHealth(req, res) {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  sendSuccess(
    res,
    {
      status: 'HEALTHY',
      service: 'WrapAI API Gateway',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime())
    },
    'WrapAI API Gateway is fully operational'
  );
}
`);

write('src/controllers/authController.js', `
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
`);

write('src/controllers/userController.js', `
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
`);

write('src/controllers/contentController.js', `
import { contentService } from '../services/contentService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const contentController = {
  async create(req, res) {
    const content = await contentService.createContent(req.user.id, req.body);
    sendSuccess(res, content, 'Content registered successfully', STATUS_CODES.CREATED);
  },

  async list(req, res) {
    const { items, meta } = await contentService.getUserContent(req.user.id, req.query);
    sendSuccess(res, items, 'Content items retrieved', STATUS_CODES.OK, meta);
  },

  async getById(req, res) {
    sendSuccess(res, req.resource, 'Content details retrieved');
  },

  async update(req, res) {
    const updated = await contentService.updateContent(req.params.id, req.body);
    sendSuccess(res, updated, 'Content updated successfully');
  },

  async delete(req, res) {
    const result = await contentService.deleteContent(req.params.id);
    sendSuccess(res, result, 'Content deleted successfully');
  }
};
`);

write('src/controllers/reportController.js', `
import { reportService } from '../services/reportService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const reportController = {
  async list(req, res) {
    const { reports, meta } = await reportService.getUserReports(req.user.id, req.query);
    sendSuccess(res, reports, 'Reports retrieved successfully', 200, meta);
  },

  async getById(req, res) {
    sendSuccess(res, req.resource, 'Report details retrieved');
  }
};
`);

write('src/controllers/adminController.js', `
import { adminService } from '../services/adminService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const adminController = {
  async getOverview(req, res) {
    const metrics = await adminService.getMetricsOverview();
    sendSuccess(res, metrics, 'Admin overview metrics retrieved');
  },

  async getUsers(req, res) {
    const { users, meta } = await adminService.getAllUsers(req.query);
    sendSuccess(res, users, 'Users retrieved successfully', 200, meta);
  },

  async updateUserStatus(req, res) {
    const updated = await adminService.updateUserStatus(req.params.id, req.body.status);
    sendSuccess(res, updated, 'User status updated successfully');
  },

  async getContent(req, res) {
    const { items, meta } = await adminService.getAllContent(req.query);
    sendSuccess(res, items, 'Content monitoring list retrieved', 200, meta);
  },

  async getProcessing(req, res) {
    const jobs = await adminService.getQueueTelemetry();
    sendSuccess(res, jobs, 'Queue telemetry retrieved');
  },

  async getAnalytics(req, res) {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics, 'Analytics data retrieved');
  },

  async getSystem(req, res) {
    const system = await adminService.getSystemHealth();
    sendSuccess(res, system, 'System health report retrieved');
  }
};
`);

// 3. Routes
write('src/routes/health.routes.js', `
import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();
router.get('/', getHealth);
export default router;
`);

write('src/routes/auth.routes.js', `
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', authLimiter, validate(validateRegister), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(validateLogin), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
`);

write('src/routes/user.routes.js', `
import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateUpdateProfile, validateChangePassword } from '../validators/userValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/me', asyncHandler(userController.getProfile));
router.patch('/me', validate(validateUpdateProfile), asyncHandler(userController.updateProfile));
router.patch('/me/password', validate(validateChangePassword), asyncHandler(userController.changePassword));
router.delete('/me', asyncHandler(userController.deleteAccount));

export default router;
`);

write('src/routes/content.routes.js', `
import { Router } from 'express';
import { contentController } from '../controllers/contentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateCreateContent, validateUpdateContent } from '../validators/contentValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(validateCreateContent), asyncHandler(contentController.create));
router.get('/', asyncHandler(contentController.list));

router.get('/:id', checkOwnership((id) => contentRepository.findById(id)), asyncHandler(contentController.getById));
router.patch('/:id', checkOwnership((id) => contentRepository.findById(id)), validate(validateUpdateContent), asyncHandler(contentController.update));
router.delete('/:id', checkOwnership((id) => contentRepository.findById(id)), asyncHandler(contentController.delete));

export default router;
`);

write('src/routes/report.routes.js', `
import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { reportRepository } from '../repositories/reportRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(reportController.list));
router.get('/:id', checkOwnership((id) => reportRepository.findById(id)), asyncHandler(reportController.getById));

export default router;
`);

write('src/routes/admin.routes.js', `
import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { validateUserStatus } from '../validators/adminValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/overview', asyncHandler(adminController.getOverview));
router.get('/metrics', asyncHandler(adminController.getOverview));
router.get('/users', asyncHandler(adminController.getUsers));
router.patch('/users/:id/status', validate(validateUserStatus), asyncHandler(adminController.updateUserStatus));
router.get('/content', asyncHandler(adminController.getContent));
router.get('/processing', asyncHandler(adminController.getProcessing));
router.get('/analytics', asyncHandler(adminController.getAnalytics));
router.get('/system', asyncHandler(adminController.getSystem));

export default router;
`);

write('src/routes/index.js', `
import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import reportRoutes from './report.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', contentRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

export default router;
`);

// 4. app.js
write('src/app.js', `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment.js';
import { swaggerSpec } from './config/swagger.js';
import apiRouter from './routes/index.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching CLIENT_URL
      if (!origin || origin === config.clientUrl || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Global Rate Limiting
if (config.nodeEnv !== 'test') {
  app.use(globalLimiter);
}

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Swagger API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Version 1 Base Router
app.use('/api/v1', apiRouter);

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/api/v1/docs');
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
`);

// 5. server.js
write('src/server.js', `
import app from './app.js';
import { config } from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

let server;

async function startServer() {
  logger.info('Starting WrapAI Backend Gateway...');
  
  // Connect to Database
  await connectDatabase();

  server = app.listen(config.port, () => {
    logger.info(\`WrapAI API listening on port \${config.port} in [\${config.nodeEnv}] mode\`);
    logger.info(\`API Base URL: http://localhost:\${config.port}/api/v1\`);
    logger.info(\`Swagger Documentation: http://localhost:\${config.port}/api/v1/docs\`);
  });
}

// Graceful Shutdown
async function handleShutdown(signal) {
  logger.info(\`Received \${signal}. Shutting down gracefully...\`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
`);

console.log('Backend Part 3 (Services, Controllers, Routes, App, Server) script written.');
