const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { validateProfile } = require('../middleware/validator');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Candidate profiles endpoints
router.get('/', authenticate, authorize('candidate'), asyncHandler(profileController.getProfile));
router.put('/', authenticate, authorize('candidate'), validateProfile, asyncHandler(profileController.updateProfile));

module.exports = router;
