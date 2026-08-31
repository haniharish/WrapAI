import { contentRepository } from '../repositories/contentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { storageService } from './storageService.js';
import { processingQueueService } from './processingQueueService.js';
import { embeddingService } from './embeddingService.js';
import { youtubeService } from './youtubeService.js';
import { chatRepository } from '../repositories/chatRepository.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/environment.js';
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

    if (content.userId.toString() !== userId && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to view this content');
    }

    return content;
  },

  async createContent(userId, body) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const content = await contentRepository.create({
      userId,
      title: body.title ? body.title.trim() : 'Untitled Content',
      description: body.description || '',
      contentType: body.contentType || CONTENT_TYPES.AUDIO,
      sourceType: body.sourceType || 'UPLOAD',
      sourceUrl: body.sourceUrl || null,
      rawText: body.rawText || null,
      processingStatus: PROCESSING_STATUS.UPLOADED,
      language: body.language || 'en',
      tags: body.tags ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map(t => t.trim())) : []
    });

    await auditLogRepository.createLog({
      userId,
      action: 'CONTENT_CREATED',
      resourceType: 'CONTENT',
      resourceId: content._id.toString(),
      metadata: { title: content.title, contentType: content.contentType }
    });

    // Auto-enqueue processing job in Phase 6
    await processingQueueService.enqueueContentProcessing(content._id, userId).catch(() => {});

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

      user.storageUsedBytes = newTotalStorage;
      await user.save();

      await auditLogRepository.createLog({
        userId,
        action: 'CONTENT_CREATED',
        resourceType: 'CONTENT',
        resourceId: content._id.toString(),
        metadata: { title: content.title, contentType, fileSizeBytes: file.size }
      });

      // Auto-enqueue processing job in Phase 6
      await processingQueueService.enqueueContentProcessing(content._id, userId).catch(() => {});

      return content;
    } catch (dbErr) {
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

    // Auto-enqueue processing job in Phase 6
    await processingQueueService.enqueueContentProcessing(content._id, userId).catch(() => {});

    return content;
  },

  async createUrlContent(userId, { title, url, description, tags, language }) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    let resolvedTitle = title ? title.trim() : '';
    let durationSec = null;

    if (youtubeService.isYouTubeUrl(url)) {
      try {
        const meta = await youtubeService.fetchVideoMetadata(url);
        if (meta) {
          if (!resolvedTitle || resolvedTitle === 'Linked Media Stream' || resolvedTitle === 'YouTube Video') {
            resolvedTitle = meta.title;
          }
          durationSec = meta.durationSeconds;
        }
      } catch {
        // Fallback to title
      }
    }

    if (!resolvedTitle) {
      resolvedTitle = 'Linked Media Stream';
    }

    const content = await contentRepository.create({
      userId,
      title: resolvedTitle,
      description: description || '',
      contentType: CONTENT_TYPES.URL,
      sourceType: 'URL',
      sourceUrl: url.trim(),
      mediaDurationSeconds: durationSec,
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

    // Auto-enqueue processing job
    await processingQueueService.enqueueContentProcessing(content._id, userId).catch(() => {});

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

    await contentRepository.softDelete(contentId, userId);

    if (content.storageKey) {
      await storageService.deleteFile(content.storageKey);
    }

    // Phase 10: Cascade delete vector index and chat history
    await Promise.allSettled([
      embeddingService.deleteIndexForContent(contentId),
      chatRepository.deleteByContentId(contentId)
    ]);

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
