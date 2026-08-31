/**
 * Wraps asynchronous route handlers to eliminate try/catch boilerplate.
 * Any rejected promise is passed automatically to express next() error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
