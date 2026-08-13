const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const c = require('../controllers/student.controller');

router.use(protect, allow('student'));

router.get('/mentor', c.getMyMentor);
router.get('/sessions', c.getMySessions);
router.post('/concerns', [body('description').trim().notEmpty()], validate, c.submitConcern);
router.get('/concerns', c.getMyConcerns);
router.get('/messages', c.getConversationWithMentor);
router.post('/messages', [body('content').trim().notEmpty()], validate, c.sendMessageToMentor);
router.get('/notifications', c.listMyNotifications);
router.patch('/notifications/:id/read', param('id').isMongoId(), validate, c.markNotificationRead);

module.exports = router;
