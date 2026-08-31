import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wrapai'
  },
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  },
  queue: {
    name: process.env.PROCESSING_QUEUE_NAME || 'content-processing',
    concurrency: parseInt(process.env.WORKER_CONCURRENCY, 10) || 2,
    jobAttempts: parseInt(process.env.JOB_ATTEMPTS, 10) || 3,
    backoffDelay: parseInt(process.env.JOB_BACKOFF_DELAY, 10) || 2000,
    mockFailure: process.env.MOCK_PROCESSING_FAILURE === 'true'
  },
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY || 'wrapai_internal_ai_service_secret_key_minimum_32_chars_2026',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 600000
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
    signedUrlExpiresIn: parseInt(process.env.SIGNED_URL_EXPIRATION, 10) || 3600,
    maxAudioSizeBytes: parseInt(process.env.MAX_AUDIO_SIZE, 10) || 100 * 1024 * 1024,
    maxVideoSizeBytes: parseInt(process.env.MAX_VIDEO_SIZE, 10) || 500 * 1024 * 1024,
    maxDocumentSizeBytes: parseInt(process.env.MAX_DOCUMENT_SIZE, 10) || 50 * 1024 * 1024,
    maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH, 10) || 100000
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 20
  },
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
};
