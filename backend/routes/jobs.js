const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { validateJob } = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Saved/Bookmarked jobs (Candidates only)
// Note: Must be placed before /:id parameter match routes to prevent express from matching "saved" as an ":id"
router.get('/saved', authenticate, authorize('candidate'), asyncHandler(jobController.getSavedJobs));
router.post('/:id/save', authenticate, authorize('candidate'), asyncHandler(jobController.saveJob));
router.delete('/:id/unsave', authenticate, authorize('candidate'), asyncHandler(jobController.unsaveJob));

// Recruiter listings
router.get('/my-postings', authenticate, authorize('recruiter'), asyncHandler(jobController.getMyPostedJobs));

// Public listings & general CRUD
router.get('/', asyncHandler(jobController.getAllJobs));
router.get('/:id', asyncHandler(jobController.getJobById));
router.post('/', authenticate, authorize('recruiter'), validateJob, asyncHandler(jobController.createJob));
router.put('/:id', authenticate, authorize('recruiter', 'admin'), validateJob, asyncHandler(jobController.updateJob));
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), asyncHandler(jobController.deleteJob));

module.exports = router;
