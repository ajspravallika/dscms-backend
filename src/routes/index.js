const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const mentorRoutes = require('./mentor.routes');
const studentRoutes = require('./student.routes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/mentor', mentorRoutes);
router.use('/student', studentRoutes);

module.exports = router;
