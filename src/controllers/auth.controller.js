const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

/**
 * POST /api/v1/auth/login
 * Public route. Domain restriction is enforced at the schema level
 * (User.model.js email validator) — any account in the DB is already
 * guaranteed to be an @svecw.edu.in address, and since registration
 * is disabled, the only way an account exists is via Admin creation.
 */
const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);

  return success(res, 200, { user, token }, 'Login successful');
});

/**
 * POST /api/v1/auth/change-password
 * Used both for the forced first-login reset (mustResetPassword=true)
 * and voluntary password changes thereafter.
 */
const changePasswordHandler = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  return success(res, 200, null, 'Password updated successfully');
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's own profile, derived strictly
 * from the verified JWT payload (req.user is set by auth.middleware).
 */
const meHandler = asyncHandler(async (req, res) => {
  return success(res, 200, { user: req.user }, 'Current user fetched');
});

/**
 * POST /api/v1/auth/logout
 * Since V1 uses stateless JWTs with no refresh-token/session store,
 * logout is handled client-side by discarding the token. This endpoint
 * exists for API symmetry and future extension (e.g., token blacklist).
 */
const logoutHandler = asyncHandler(async (req, res) => {
  return success(res, 200, null, 'Logged out successfully');
});

module.exports = {
  loginHandler,
  changePasswordHandler,
  meHandler,
  logoutHandler,
};
