export function validateUpdateProfile(body) {
  const errors = {};
  if (body.fullName && body.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  return errors;
}

export function validateChangePassword(body) {
  const errors = {};
  if (!body.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }
  if (!body.newPassword || body.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long';
  }
  return errors;
}
