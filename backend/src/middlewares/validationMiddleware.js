import { ApiError } from '../utils/ApiError.js';

/**
 * Validates request payload against schema definition functions
 */
export function validate(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req.body, req.params, req.query);
    if (errors && Object.keys(errors).length > 0) {
      return next(ApiError.badRequest('Request validation failed', errors));
    }
    next();
  };
}
