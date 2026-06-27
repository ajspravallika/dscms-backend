const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { error } = require('../utils/apiResponse');

/**
 * Verifies the Bearer JWT on the Authorization header, loads the
 * corresponding user fresh from the DB (so a deactivated account is
 * rejected immediately even if the token hasn't expired yet), and
 * attaches a trimmed user object to req.user.
 *
 * Every downstream "scoping" check (mentor sees only their students,
 * student sees only their own data) relies on req.user.id / req.user.role
 * coming ONLY from this verified token — never from query params or body.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'Not authorized. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, 401, 'Session expired. Please log in again.');
      }
      return error(res, 401, 'Not authorized. Invalid token.');
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return error(res, 401, 'Not authorized. User no longer exists.');
    }

    if (!user.isActive) {
      return error(res, 403, 'This account has been deactivated. Contact the administrator.');
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      mustResetPassword: user.mustResetPassword,
    };

    next();
  } catch (err) {
    return error(res, 500, 'Authentication error', err.message);
  }
};

module.exports = { protect };
