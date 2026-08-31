import crypto from 'crypto';

/**
 * Correlation middleware attaches a unique requestId to incoming requests and sets X-Request-ID header
 */
export function correlationMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export default correlationMiddleware;
