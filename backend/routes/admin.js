const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Recruiter stats (mounted here or under an admin/recruiter scope)
router.get('/stats', authenticate, authorize('recruiter'), asyncHandler(adminController.getRecruiterStats));

// Admin stats and dashboard management
router.get('/admin-stats', authenticate, authorize('admin'), asyncHandler(adminController.getAdminStats));
router.get('/users', authenticate, authorize('admin'), asyncHandler(adminController.getAllUsers));
router.delete('/users/:id', authenticate, authorize('admin'), asyncHandler(adminController.deleteUser));
router.get('/jobs', authenticate, authorize('admin'), asyncHandler(adminController.getAdminJobs));

module.exports = router;
