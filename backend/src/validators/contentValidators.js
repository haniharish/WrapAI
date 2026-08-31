import { CONTENT_TYPES } from '../constants/contentTypes.js';

export function validateCreateContent(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (body.title.length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }
  return errors;
}

export function validateTextSubmission(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!body.text || body.text.trim().length === 0) {
    errors.text = 'Raw text body is required';
  } else if (body.text.length > 100000) {
    errors.text = 'Text exceeds maximum length of 100,000 characters';
  }
  return errors;
}

export function validateUrlSubmission(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!body.url || body.url.trim().length === 0) {
    errors.url = 'URL is required';
  } else {
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.url = 'Only HTTP and HTTPS URLs are supported';
      }
      // SSRF checks
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.')) {
        errors.url = 'Local or private network URLs are not allowed';
      }
    } catch {
      errors.url = 'Invalid URL format';
    }
  }
  return errors;
}

export function validateUpdateContent(body) {
  const errors = {};
  if (body.title !== undefined && body.title.trim().length === 0) {
    errors.title = 'Title cannot be empty';
  }
  return errors;
}
