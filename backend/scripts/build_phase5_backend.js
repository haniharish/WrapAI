// backend/scripts/build_phase5_backend.js
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

// 1. src/config/environment.js
write('src/config/environment.js', `
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wrapai'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'wrapai_jwt_secret_development_key_minimum_32_chars_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'wrapai_jwt_refresh_secret_key_minimum_32_chars_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'AWS_S3',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'wrapai-content-storage',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    signedUrlExpiresIn: parseInt(process.env.SIGNED_URL_EXPIRATION, 10) || 3600, // 1 hour
    maxAudioSizeBytes: parseInt(process.env.MAX_AUDIO_SIZE, 10) || 100 * 1024 * 1024, // 100MB
    maxVideoSizeBytes: parseInt(process.env.MAX_VIDEO_SIZE, 10) || 500 * 1024 * 1024, // 500MB
    maxDocumentSizeBytes: parseInt(process.env.MAX_DOCUMENT_SIZE, 10) || 50 * 1024 * 1024, // 50MB
    maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH, 10) || 100000 // 100k chars
  },
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
};
`);

// 2. src/models/Content.js
write('src/models/Content.js', `
import mongoose from 'mongoose';
import { CONTENT_TYPES, PROCESSING_STATUS } from '../constants/contentTypes.js';

const summarySchema = new mongoose.Schema(
  {
    keyTakeaway: { type: String, default: '' },
    executiveSummary: { type: String, default: '' },
    detailedSummary: { type: String, default: '' },
    modelVersion: { type: String, default: 'gemini-1.5-pro' },
    generatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const keyPointSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    speakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Speaker', default: null },
    speakerName: { type: String, default: '' },
    category: { type: String, default: 'General' },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 }
  },
  { _id: false }
);

const highlightSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    importance: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' }
  },
  { _id: false }
);

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
    sourceType: {
      type: String,
      enum: ['UPLOAD', 'URL', 'TEXT'],
      default: 'UPLOAD'
    },
    originalFileName: {
      type: String,
      default: null
    },
    sourceUrl: {
      type: String,
      default: null
    },
    rawText: {
      type: String,
      default: null
    },
    storageProvider: {
      type: String,
      enum: ['AWS_S3', 'LOCAL_STORAGE'],
      default: 'AWS_S3'
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
    language: {
      type: String,
      default: 'en'
    },
    speakersCount: {
      type: Number,
      default: 0
    },
    hasReport: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    summary: {
      type: summarySchema,
      default: () => ({})
    },
    keyPoints: {
      type: [keyPointSchema],
      default: []
    },
    highlights: {
      type: [highlightSchema],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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
contentSchema.index({ userId: 1, processingStatus: 1 });
contentSchema.index({ userId: 1, contentType: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Content = mongoose.model('Content', contentSchema);
`);

// 3. src/services/storageService.js
write('src/services/storageService.js', `
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

class StorageService {
  constructor() {
    const hasAwsCreds = Boolean(config.storage.accessKeyId && config.storage.secretAccessKey);
    this.isS3 = hasAwsCreds && config.storage.provider === 'AWS_S3';

    if (this.isS3) {
      this.s3Client = new S3Client({
        region: config.storage.awsRegion,
        credentials: {
          accessKeyId: config.storage.accessKeyId,
          secretAccessKey: config.storage.secretAccessKey
        }
      });
      this.bucket = config.storage.s3Bucket;
      logger.info('StorageService initialized with AWS S3 provider', { bucket: this.bucket, region: config.storage.awsRegion });
    } else {
      this.localStorageDir = path.resolve('uploads');
      if (!fs.existsSync(this.localStorageDir)) {
        fs.mkdirSync(this.localStorageDir, { recursive: true });
      }
      logger.info('StorageService initialized with Local Mock Storage provider (Safe Offline Fallback)', { dir: this.localStorageDir });
    }
  }

  generateStorageKey(userId, originalFileName) {
    const ext = path.extname(originalFileName || '').toLowerCase() || '.bin';
    const uuid = crypto.randomUUID();
    const cleanName = path.basename(originalFileName || 'file', ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    return \`users/\${userId}/content/\${uuid}/\${cleanName}\${ext}\`;
  }

  async uploadFile({ userId, originalFileName, buffer, mimeType }) {
    const storageKey = this.generateStorageKey(userId, originalFileName);

    if (this.isS3) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          userId: userId.toString(),
          originalFileName: encodeURIComponent(originalFileName)
        }
      });
      await this.s3Client.send(command);
      logger.info('File uploaded to AWS S3', { storageKey, mimeType });
      return { storageKey, storageProvider: 'AWS_S3' };
    } else {
      // Local fallback storage
      const fullPath = path.join(this.localStorageDir, storageKey.replace(/\\//g, '_'));
      fs.writeFileSync(fullPath, buffer);
      logger.info('File written to Local Fallback Storage', { fullPath, storageKey });
      return { storageKey, storageProvider: 'LOCAL_STORAGE' };
    }
  }

  async deleteFile(storageKey) {
    if (!storageKey) return;
    try {
      if (this.isS3) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        });
        await this.s3Client.send(command);
        logger.info('File deleted from AWS S3', { storageKey });
      } else {
        const fullPath = path.join(this.localStorageDir, storageKey.replace(/\\//g, '_'));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          logger.info('File deleted from Local Fallback Storage', { fullPath });
        }
      }
    } catch (err) {
      logger.error('Failed to delete file from storage', { storageKey, error: err.message });
      // Non-fatal error logged for compensation
    }
  }

  async getSignedAccessUrl(storageKey, expiresInSeconds = config.storage.signedUrlExpiresIn) {
    if (!storageKey) return null;

    if (this.isS3) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      });
      return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } else {
      // For local fallback development, return direct API streaming endpoint
      return \`\${config.clientUrl.replace(':5173', ':5000')}/api/v1/content/stream/\${encodeURIComponent(storageKey)}\`;
    }
  }
}

export const storageService = new StorageService();
`);

// 4. src/middlewares/uploadMiddleware.js
write('src/middlewares/uploadMiddleware.js', `
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/environment.js';

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  // Document
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]);

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.has(file.mimetype) || file.originalname.match(/\\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm|mov|txt|pdf|docx|doc)$/i)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(\`Unsupported file type: \${file.mimetype || file.originalname}. Supported formats: MP3, WAV, M4A, AAC, MP4, MOV, WebM, TXT, PDF, DOCX.\`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxVideoSizeBytes // 500MB max limit on multer
  }
});
`);

// 5. src/validators/contentValidators.js
write('src/validators/contentValidators.js', `
import { CONTENT_TYPES } from '../constants/contentTypes.js';

export function validateCreateContent(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (body.title.length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }
  return errors;
}

export function validateTextSubmission(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!body.text || body.text.trim().length === 0) {
    errors.text = 'Raw text body is required';
  } else if (body.text.length > 100000) {
    errors.text = 'Text exceeds maximum length of 100,000 characters';
  }
  return errors;
}

export function validateUrlSubmission(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!body.url || body.url.trim().length === 0) {
    errors.url = 'URL is required';
  } else {
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.url = 'Only HTTP and HTTPS URLs are supported';
      }
      // SSRF checks
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.')) {
        errors.url = 'Local or private network URLs are not allowed';
      }
    } catch {
      errors.url = 'Invalid URL format';
    }
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

// 6. src/services/contentService.js
write('src/services/contentService.js', `
import { contentRepository } from '../repositories/contentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { storageService } from './storageService.js';
import { ApiError } from '../utils/ApiError.js';
import { CONTENT_TYPES, PROCESSING_STATUS } from '../constants/contentTypes.js';
import path from 'path';

function detectContentType(mimetype, originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  if (mimetype.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].includes(ext)) {
    return CONTENT_TYPES.AUDIO;
  }
  if (mimetype.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
    return CONTENT_TYPES.VIDEO;
  }
  return CONTENT_TYPES.DOCUMENT;
}

export const contentService = {
  async listUserContent(userId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      userId,
      isDeleted: false
    };

    if (query.type) {
      filter.contentType = query.type;
    }
    if (query.status) {
      filter.processingStatus = query.status;
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { originalFileName: { $regex: query.search, $options: 'i' } }
      ];
    }

    const sortOption = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      contentRepository.find(filter, { skip, limit, sort: sortOption }),
      contentRepository.count(filter)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getContentById(contentId, userId, userRole) {
    const content = await contentRepository.findById(contentId);
    if (!content || content.isDeleted) {
      throw ApiError.notFound('Content not found');
    }

    // Multi-tenant Ownership check
    if (content.userId.toString() !== userId && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to view this content');
    }

    return content;
  },

  async uploadFileContent(userId, file, body) {
    if (!file) {
      throw ApiError.badRequest('File is required for upload');
    }

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Storage Quota Enforcement
    const newTotalStorage = (user.storageUsedBytes || 0) + file.size;
    if (newTotalStorage > (user.storageLimitBytes || 5368709120)) {
      throw ApiError.badRequest('Storage quota exceeded. Please upgrade your plan or delete existing files.');
    }

    const contentType = detectContentType(file.mimetype, file.originalname);
    const title = body.title ? body.title.trim() : path.basename(file.originalname, path.extname(file.originalname));

    // Upload to Object Storage
    const { storageKey, storageProvider } = await storageService.uploadFile({
      userId,
      originalFileName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype
    });

    try {
      // Create MongoDB Content Record
      const content = await contentRepository.create({
        userId,
        title,
        description: body.description || '',
        contentType,
        sourceType: 'UPLOAD',
        originalFileName: file.originalname,
        storageKey,
        storageProvider,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        processingStatus: PROCESSING_STATUS.UPLOADED,
        language: body.language || 'en',
        tags: body.tags ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map(t => t.trim())) : []
      });

      // Update user storage footprint
      user.storageUsedBytes = newTotalStorage;
      await user.save();

      // Audit Log
      await auditLogRepository.createLog({
        userId,
        action: 'CONTENT_CREATED',
        resourceType: 'CONTENT',
        resourceId: content._id.toString(),
        metadata: { title: content.title, contentType, fileSizeBytes: file.size }
      });

      return content;
    } catch (dbErr) {
      // Cleanup orphaned storage object if MongoDB insertion fails
      await storageService.deleteFile(storageKey);
      throw dbErr;
    }
  },

  async createTextContent(userId, { title, text, description, tags, language }) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const content = await contentRepository.create({
      userId,
      title: title.trim(),
      description: description || '',
      contentType: CONTENT_TYPES.TEXT,
      sourceType: 'TEXT',
      rawText: text,
      fileSizeBytes: Buffer.byteLength(text, 'utf8'),
      mimeType: 'text/plain',
      processingStatus: PROCESSING_STATUS.UPLOADED,
      language: language || 'en',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    });

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_CREATED',
      resourceType: 'CONTENT',
      resourceId: content._id.toString(),
      metadata: { title: content.title, contentType: CONTENT_TYPES.TEXT }
    });

    return content;
  },

  async createUrlContent(userId, { title, url, description, tags, language }) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const content = await contentRepository.create({
      userId,
      title: title.trim(),
      description: description || '',
      contentType: CONTENT_TYPES.URL,
      sourceType: 'URL',
      sourceUrl: url.trim(),
      processingStatus: PROCESSING_STATUS.UPLOADED,
      language: language || 'en',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    });

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_CREATED',
      resourceType: 'CONTENT',
      resourceId: content._id.toString(),
      metadata: { title: content.title, contentType: CONTENT_TYPES.URL, sourceUrl: url }
    });

    return content;
  },

  async updateContent(contentId, userId, userRole, updates) {
    const content = await this.getContentById(contentId, userId, userRole);

    const allowed = {};
    if (updates.title !== undefined) allowed.title = updates.title.trim();
    if (updates.description !== undefined) allowed.description = updates.description.trim();
    if (updates.tags !== undefined) allowed.tags = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim());

    const updated = await contentRepository.updateById(contentId, allowed);

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_RENAMED',
      resourceType: 'CONTENT',
      resourceId: contentId.toString(),
      metadata: { updatedFields: Object.keys(allowed) }
    });

    return updated;
  },

  async deleteContent(contentId, userId, userRole) {
    const content = await this.getContentById(contentId, userId, userRole);

    // Soft delete in DB
    await contentRepository.softDelete(contentId, userId);

    // Delete binary object from object storage
    if (content.storageKey) {
      await storageService.deleteFile(content.storageKey);
    }

    // Reclaim storage quota
    if (content.fileSizeBytes > 0) {
      const user = await userRepository.findById(content.userId);
      if (user) {
        user.storageUsedBytes = Math.max(0, (user.storageUsedBytes || 0) - content.fileSizeBytes);
        await user.save();
      }
    }

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_DELETED',
      resourceType: 'CONTENT',
      resourceId: contentId.toString(),
      metadata: { title: content.title }
    });

    return { success: true, message: 'Content deleted successfully' };
  },

  async getAccessUrl(contentId, userId, userRole) {
    const content = await this.getContentById(contentId, userId, userRole);
    if (!content.storageKey) {
      throw ApiError.badRequest('This content item does not have an attached media/storage file');
    }
    const signedUrl = await storageService.getSignedAccessUrl(content.storageKey);
    return { signedUrl, expiresInSeconds: config.storage.signedUrlExpiresIn };
  }
};
`);

// 7. src/controllers/contentController.js
write('src/controllers/contentController.js', `
import { contentService } from '../services/contentService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const contentController = {
  async list(req, res) {
    const result = await contentService.listUserContent(req.user.id, req.query);
    sendSuccess(res, result.items, 'Content retrieved successfully', STATUS_CODES.OK, result.pagination);
  },

  async getById(req, res) {
    const content = await contentService.getContentById(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, content, 'Content details retrieved successfully');
  },

  async upload(req, res) {
    const content = await contentService.uploadFileContent(req.user.id, req.file, req.body);
    sendSuccess(res, content, 'File uploaded and content created successfully', STATUS_CODES.CREATED);
  },

  async createText(req, res) {
    const content = await contentService.createTextContent(req.user.id, req.body);
    sendSuccess(res, content, 'Text content created successfully', STATUS_CODES.CREATED);
  },

  async createUrl(req, res) {
    const content = await contentService.createUrlContent(req.user.id, req.body);
    sendSuccess(res, content, 'URL content created successfully', STATUS_CODES.CREATED);
  },

  async update(req, res) {
    const content = await contentService.updateContent(req.params.id, req.user.id, req.user.role, req.body);
    sendSuccess(res, content, 'Content updated successfully');
  },

  async delete(req, res) {
    const result = await contentService.deleteContent(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, result, 'Content deleted successfully');
  },

  async getAccess(req, res) {
    const result = await contentService.getAccessUrl(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, result, 'Secure media access URL generated');
  }
};
`);

// 8. src/routes/content.routes.js
write('src/routes/content.routes.js', `
import { Router } from 'express';
import { contentController } from '../controllers/contentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  validateTextSubmission,
  validateUrlSubmission,
  validateUpdateContent
} from '../validators/contentValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(contentController.list));
router.post('/upload', upload.single('file'), asyncHandler(contentController.upload));
router.post('/text', validate(validateTextSubmission), asyncHandler(contentController.createText));
router.post('/url', validate(validateUrlSubmission), asyncHandler(contentController.createUrl));
router.get('/:id', asyncHandler(contentController.getById));
router.patch('/:id', validate(validateUpdateContent), asyncHandler(contentController.update));
router.delete('/:id', asyncHandler(contentController.delete));
router.get('/:id/access', asyncHandler(contentController.getAccess));

export default router;
`);

console.log('Phase 5 Backend Upload & Content Layer Generated.');
