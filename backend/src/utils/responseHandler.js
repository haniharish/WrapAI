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
