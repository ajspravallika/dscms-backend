const { error } = require('../utils/apiResponse');

/**
 * Centralized error handler — must be registered LAST in app.js, after
 * all routes. Catches errors forwarded via next(err) (including those
 * surfaced by asyncHandler) and normalizes Mongoose-specific error types
 * into clean API responses.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose duplicate key error (e.g., email or rollNumber already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return error(res, 409, `${field} already exists`);
  }

  // Mongoose validation error (schema-level validators)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, 400, 'Validation failed', messages);
  }

  // Mongoose invalid ObjectId cast
  if (err.name === 'CastError') {
    return error(res, 400, `Invalid value for ${err.path}`);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return error(res, statusCode, message);
};

/**
 * 404 handler for unmatched routes — registered after all routes,
 * before errorHandler.
 */
const notFound = (req, res) => {
  return error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = { errorHandler, notFound };
