const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const { validateApplication, validateStatusUpdate } = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Candidate application operations
router.get('/', authenticate, authorize('candidate'), asyncHandler(appController.getMyApplications));
router.post('/', authenticate, authorize('candidate'), validateApplication, asyncHandler(appController.applyJob));
router.delete('/:id', authenticate, authorize('candidate'), asyncHandler(appController.withdrawApplication));

// Recruiter/Admin view & status operations
router.get('/job/:jobId', authenticate, authorize('recruiter', 'admin'), asyncHandler(appController.getJobApplicants));
router.patch('/:id/status', authenticate, authorize('recruiter', 'admin'), validateStatusUpdate, asyncHandler(appController.updateApplicationStatus));

module.exports = router;
