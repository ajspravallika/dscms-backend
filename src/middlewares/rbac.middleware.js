const { error } = require('../utils/apiResponse');

/**
 * Role guard. Usage: router.get('/admin/x', protect, allow('admin'), handler)
 *
 * This is a defense-in-depth check — the frontend also hides UI by role,
 * but that is cosmetic only. This middleware is the actual enforcement
 * point and runs on every protected route regardless of what the client
 * sends or shows.
 */
const allow = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return error(res, 401, 'Not authorized.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 403, 'You do not have permission to perform this action.');
    }

    next();
  };
};

module.exports = { allow };
