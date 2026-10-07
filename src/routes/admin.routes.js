const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const c = require('../controllers/admin.controller');
const sc = require('../controllers/settings.controller');

router.use(protect, allow('admin'));

// Settings (default passwords)
router.get('/settings', sc.getSettings);
router.patch('/settings/:key', sc.updateSetting);

// Mentors
router.get('/mentors', c.listMentors);
router.post('/mentors', c.createMentor);
router.post('/mentors/bulk-upload', upload.single('file'), c.bulkUploadMentors);
router.get('/mentors/:mentorId/workload', c.getMentorWorkload);
router.get('/mentors/:mentorId/students', c.getMentorStudents);
router.patch('/mentors/:id', c.updateMentor);
router.post('/mentors/:id/deactivate', c.deactivateMentor);
router.delete('/mentors/:id', c.deleteMentor);

// Students
router.get('/students', c.listStudents);
router.post('/students', c.createStudent);
router.post('/students/bulk-upload', upload.single('file'), c.bulkUploadStudents);
router.post('/students/promote', c.promoteStudents);
router.get('/students/passout-batches', c.listPassoutBatches);
router.delete('/students/passout-batch', c.deletePassoutBatch);
router.patch('/students/:id', c.updateStudent);
router.post('/students/:id/deactivate', c.deactivateStudent);
router.delete('/students/:id', c.deleteStudent);

// Assignments
router.get('/assignments', c.listAssignments);
router.post('/assignments/assign', c.assignStudents);
router.post('/assignments/unassign', c.unassignStudents);
router.post('/assignments/auto-assign', c.autoAssignStudents);

// Departments
router.get('/departments', c.listDepartments);
router.post('/departments', c.createDepartment);
router.patch('/departments/:id', c.updateDepartment);

// Sessions
router.get('/sessions', c.getAllSessions);

module.exports = router;
