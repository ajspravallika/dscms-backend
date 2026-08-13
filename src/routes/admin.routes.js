const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const c = require('../controllers/admin.controller');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect, allow('admin'));

router.post('/mentors', c.createMentor);
router.get('/mentors', c.listMentors);
router.patch('/mentors/:id', c.updateMentor);
router.post('/mentors/:id/deactivate', c.deactivateMentor);
router.delete('/mentors/:id', c.deleteMentor);
router.post('/mentors/:id/reassign', [body('toMentorId').isMongoId()], validate, c.reassignMentorStudents);
router.post('/mentors/bulk-upload', upload.single('file'), c.bulkUploadMentors);

router.post('/students', c.createStudent);
router.get('/students', c.listStudents);
router.patch('/students/:id', c.updateStudent);
router.post('/students/:id/deactivate', c.deactivateStudent);
router.delete('/students/:id', c.deleteStudent);
router.post('/students/bulk-upload', upload.single('file'), c.bulkUploadStudents);
router.post('/students/promote', c.promoteStudents);
router.get('/students/passout-batches', c.listPassoutBatches);
router.delete('/students/passout-batch', [body('batchLabel').notEmpty()], validate, c.deletePassoutBatch);

router.post('/assignments', c.assignStudent);
router.get('/assignments', c.listAssignments);

router.get('/sessions', c.listAllSessions);
router.get('/sessions/submitted', c.listSubmittedSessions);
router.get('/reports', c.listAllReports);

module.exports = router;
