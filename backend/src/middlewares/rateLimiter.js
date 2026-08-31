import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';

const isTest = () => config.nodeEnv === 'test';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000,
  max: config.rateLimit?.max || 300,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED'));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again in 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Upload rate limit exceeded. Please wait a minute before uploading again.', 'UPLOAD_RATE_LIMIT_EXCEEDED'));
  }
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'RAG chat query limit exceeded. Please wait a moment.', 'CHAT_RATE_LIMIT_EXCEEDED'));
  }
});

export const reportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Report generation limit reached. Please wait a minute.', 'REPORT_RATE_LIMIT_EXCEEDED'));
  }
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Search query limit reached. Please try again shortly.', 'SEARCH_RATE_LIMIT_EXCEEDED'));
  }
});
