export function validateRegister(body) {
  const errors = {};
  if (!body.fullName || body.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  if (!body.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(body.email)) {
    errors.email = 'Valid email address is required';
  }
  if (!body.password || body.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  return errors;
}

export function validateLogin(body) {
  const errors = {};
  if (!body.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(body.email)) {
    errors.email = 'Valid email address is required';
  }
  if (!body.password) {
    errors.password = 'Password is required';
  }
  return errors;
}
