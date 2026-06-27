/**
 * Wraps an async controller/middleware function so any thrown error
 * (or rejected promise) is forwarded to Express's error-handling
 * middleware via next(), instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
