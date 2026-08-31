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
