// backend/scripts/build_backend_part1.js
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

// 1. src/constants/statusCodes.js
write('src/constants/statusCodes.js', `
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};
`);

// 2. src/constants/roles.js
write('src/constants/roles.js', `
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE'
};
`);

// 3. src/constants/contentTypes.js
write('src/constants/contentTypes.js', `
export const CONTENT_TYPES = {
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  TEXT: 'TEXT',
  URL: 'URL'
};

export const PROCESSING_STATUS = {
  UPLOADED: 'UPLOADED',
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  AUDIO_EXTRACTION: 'AUDIO_EXTRACTION',
  TRANSCRIBING: 'TRANSCRIBING',
  DIARIZING: 'DIARIZING',
  ANALYZING: 'ANALYZING',
  GENERATING_EMBEDDINGS: 'GENERATING_EMBEDDINGS',
  GENERATING_REPORT: 'GENERATING_REPORT',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export const REPORT_TYPES = {
  MEETING_MINUTES: 'MEETING_MINUTES',
  LECTURE_NOTES: 'LECTURE_NOTES',
  INTERVIEW_SUMMARY: 'INTERVIEW_SUMMARY',
  EXECUTIVE_BRIEF: 'EXECUTIVE_BRIEF'
};
`);

// 4. src/utils/ApiError.js
write('src/utils/ApiError.js', `
import { STATUS_CODES, ERROR_CODES } from '../constants/statusCodes.js';

export class ApiError extends Error {
  constructor(statusCode, message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(STATUS_CODES.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(STATUS_CODES.UNAUTHORIZED, message, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  static forbidden(message = 'Access denied: insufficient permissions') {
    return new ApiError(STATUS_CODES.FORBIDDEN, message, ERROR_CODES.FORBIDDEN_ACCESS);
  }

  static notFound(message = 'Requested resource not found') {
    return new ApiError(STATUS_CODES.NOT_FOUND, message, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(STATUS_CODES.CONFLICT, message, ERROR_CODES.DUPLICATE_RESOURCE);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(STATUS_CODES.INTERNAL_SERVER_ERROR, message, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
`);

// 5. src/utils/asyncHandler.js
write('src/utils/asyncHandler.js', `
/**
 * Wraps asynchronous route handlers to eliminate try/catch boilerplate.
 * Any rejected promise is passed automatically to express next() error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
`);

// 6. src/utils/responseHandler.js
write('src/utils/responseHandler.js', `
import { STATUS_CODES } from '../constants/statusCodes.js';

export function sendSuccess(res, data = {}, message = 'Success', statusCode = STATUS_CODES.OK, meta = null) {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

export function sendError(res, message, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    message,
    error: {
      code,
      details: details || {}
    }
  };

  return res.status(statusCode).json(response);
}
`);

// 7. src/utils/logger.js
write('src/utils/logger.js', `
export const logger = {
  info: (msg, meta = {}) => {
    console.log(\`[\${new Date().toISOString()}] [INFO] \${msg}\`, Object.keys(meta).length ? meta : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(\`[\${new Date().toISOString()}] [WARN] \${msg}\`, Object.keys(meta).length ? meta : '');
  },
  error: (msg, meta = {}) => {
    console.error(\`[\${new Date().toISOString()}] [ERROR] \${msg}\`, Object.keys(meta).length ? meta : '');
  }
};
`);

// 8. src/config/environment.js
write('src/config/environment.js', `
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wrapai',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_at_least_32_characters_long_for_wrapai',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_at_least_32_chars_long',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10
  }
};
`);

// 9. src/config/database.js
write('src/config/database.js', `
import mongoose from 'mongoose';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(customUri = null) {
  const uri = customUri || config.mongoUri;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const opts = {
      autoIndex: config.nodeEnv !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(uri, opts);
    isConnected = true;
    logger.info(\`MongoDB Connected: \${conn.connection.host || 'in-memory'} / \${conn.connection.name}\`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
      isConnected = false;
    });

    return conn;
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', { error: err.message });
    if (config.nodeEnv !== 'test') {
      // Allow startup in degraded mode if database is temporarily unavailable during scaffolding
      logger.warn('Running in degraded mode without permanent database connection');
    }
    return null;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  }
}
`);

// 10. src/config/swagger.js
write('src/config/swagger.js', `
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'WrapAI REST API Gateway',
    version: '1.0.0',
    description: 'WrapAI — From Content to Clarity. Complete REST API documentation for multi-modal content intelligence, transcription, speaker diarization, RAG queries, and executive reports.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your short-lived access JWT'
      }
    },
    schemas: {
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: { type: 'object' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health probe',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System status and database connectivity',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardSuccessResponse' } } }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Rahul Sharma' },
                  email: { type: 'string', example: 'rahul@wrapai.io' },
                  password: { type: 'string', example: 'SecurePassword123' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '409': { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user & issue JWT',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'rahul@wrapai.io' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Authentication successful with JWT' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/content': {
      get: {
        summary: 'List user uploaded content items',
        tags: ['Content'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['AUDIO', 'VIDEO', 'DOCUMENT', 'TEXT', 'URL'] } }
        ],
        responses: {
          '200': { description: 'List of content items with pagination' }
        }
      }
    }
  }
};
`);

console.log('Backend Part 1 (Config, Constants, Utils, Swagger) script written.');
