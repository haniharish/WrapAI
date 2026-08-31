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
    return `users/${userId}/content/${uuid}/${cleanName}${ext}`;
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
      const fullPath = path.join(this.localStorageDir, storageKey.replace(/\//g, '_'));
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
        const fullPath = path.join(this.localStorageDir, storageKey.replace(/\//g, '_'));
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
      return `${config.clientUrl.replace(':5173', ':5000')}/api/v1/content/stream/${encodeURIComponent(storageKey)}`;
    }
  }

  generateReportStorageKey(userId, contentId, reportId, extension = 'pdf') {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return `reports/${userId}/${contentId}/${reportId}/report${ext}`;
  }

  async uploadReportBuffer({ userId, contentId, reportId, buffer, mimeType, extension = 'pdf' }) {
    const storageKey = this.generateReportStorageKey(userId, contentId, reportId, extension);

    if (this.isS3) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          userId: userId.toString(),
          contentId: contentId.toString(),
          reportId: reportId.toString()
        }
      });
      await this.s3Client.send(command);
      logger.info('Report file uploaded to AWS S3', { storageKey, mimeType });
      return { storageKey, storageProvider: 'AWS_S3' };
    } else {
      const fullPath = path.join(this.localStorageDir, storageKey.replace(/\//g, '_'));
      fs.writeFileSync(fullPath, buffer);
      logger.info('Report file written to Local Fallback Storage', { fullPath, storageKey });
      return { storageKey, storageProvider: 'LOCAL_STORAGE' };
    }
  }

  async getFileBuffer(storageKey) {
    if (!storageKey) return null;
    if (this.isS3) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      });
      const response = await this.s3Client.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } else {
      const fullPath = path.join(this.localStorageDir, storageKey.replace(/\//g, '_'));
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
      return null;
    }
  }

  getLocalFilePath(storageKey) {
    if (!storageKey || this.isS3) return null;
    const fullPath = path.join(this.localStorageDir, storageKey.replace(/\//g, '_'));
    return fs.existsSync(fullPath) ? fullPath : null;
  }
}

export const storageService = new StorageService();

