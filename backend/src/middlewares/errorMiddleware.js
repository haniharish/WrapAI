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
    message = `Invalid format for field: ${err.path}`;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  } else if (err.code === 11000) {
    statusCode = STATUS_CODES.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}`;
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
    message: `Resource not found at ${req.method} ${req.originalUrl}`,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      details: {}
    }
  });
}
