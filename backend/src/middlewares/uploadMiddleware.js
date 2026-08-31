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
  if (allowedMimeTypes.has(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm|mov|txt|pdf|docx|doc)$/i)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype || file.originalname}. Supported formats: MP3, WAV, M4A, AAC, MP4, MOV, WebM, TXT, PDF, DOCX.`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxVideoSizeBytes // 500MB max limit on multer
  }
});
