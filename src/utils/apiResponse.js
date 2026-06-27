/**
 * Standard success response shape used across all controllers.
 */
function success(res, statusCode, data, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standard error response shape. Used by error.middleware.js and
 * directly in controllers for expected error cases.
 */
function error(res, statusCode, message = 'Something went wrong', errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { success, error };
