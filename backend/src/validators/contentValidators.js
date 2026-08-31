export function validateCreateContent(body) {
  const errors = {};
  if (!body.title || body.title.trim().length === 0) {
    errors.title = 'Content title is required';
  }
  if (!body.contentType) {
    errors.contentType = 'Content type is required';
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
