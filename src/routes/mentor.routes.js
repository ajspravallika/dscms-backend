const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const c = require('../controllers/mentor.controller');

router.use(protect, allow('mentor'));

router.get('/students', c.listMyStudents);
router.get('/students/year/:year', c.getStudentsForSession);
router.get('/students/:id', param('id').isMongoId(), validate, c.getMyStudentById);

router.post('/sessions', [body('sessionDate').isISO8601(), body('year').isInt({min:1,max:4}), body('studentRecords').isArray()], validate, c.createSession);
router.get('/sessions', c.listSessions);
router.get('/sessions/:id', param('id').isMongoId(), validate, c.getSessionDetail);
router.post('/sessions/:id/submit', param('id').isMongoId(), validate, c.submitSession);

router.post('/messages', [body('studentId').isMongoId(), body('content').trim().notEmpty()], validate, c.sendMessageToStudent);
router.get('/messages/:studentId', param('studentId').isMongoId(), validate, c.getConversationWithStudent);

router.get('/concerns', c.listConcerns);
router.patch('/concerns/:id', [param('id').isMongoId(), body('mentorResponse').optional().trim(), body('status').optional()], validate, c.respondToConcern);

router.post('/reports/weekly', c.generateWeeklyReport);
router.get('/reports', c.listMyReports);

module.exports = router;
