const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginValidator, changePasswordValidator } = require('../validators/auth.validator');
const {
  loginHandler,
  changePasswordHandler,
  meHandler,
  logoutHandler,
} = require('../controllers/auth.controller');

// Public
router.post('/login', loginValidator, validate, loginHandler);

// Protected
router.post('/logout', protect, logoutHandler);
router.post('/change-password', protect, changePasswordValidator, validate, changePasswordHandler);
router.get('/me', protect, meHandler);

module.exports = router;
