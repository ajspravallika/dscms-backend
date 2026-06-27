const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createMentorValidator,
  createStudentValidator,
  updateUserValidator,
  assignStudentValidator,
} = require('../validators/user.validator');
const adminController = require('../controllers/admin.controller');

// Every route in this file is admin-only.
router.use(protect, allow('admin'));

// Mentors
router.post('/mentors', createMentorValidator, validate, adminController.createMentor);
router.get('/mentors', adminController.listMentors);
router.patch('/mentors/:id', updateUserValidator, validate, adminController.updateMentor);
router.delete('/mentors/:id', adminController.deactivateMentor);

// Students
router.post('/students', createStudentValidator, validate, adminController.createStudent);
router.get('/students', adminController.listStudents);
router.patch('/students/:id', updateUserValidator, validate, adminController.updateStudent);
router.delete('/students/:id', adminController.deactivateStudent);

// Assignments
router.post('/assignments', assignStudentValidator, validate, adminController.assignStudent);
router.get('/assignments', adminController.listAssignments);

// System-wide visibility
router.get('/sessions', adminController.listAllSessions);
router.get('/reports', adminController.listAllReports);

module.exports = router;
