export function validateUserStatus(body) {
  const errors = {};
  if (!body.status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(body.status)) {
    errors.status = 'Status must be ACTIVE, SUSPENDED, or INACTIVE';
  }
  return errors;
}
