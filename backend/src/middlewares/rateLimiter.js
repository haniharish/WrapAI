import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000,
  max: config.rateLimit?.max || 100,
  skip: () => config.nodeEnv === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again later.', 'RATE_LIMIT_EXCEEDED'));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.authRateLimit?.max || 50,
  skip: () => config.nodeEnv === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again in 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  }
});
