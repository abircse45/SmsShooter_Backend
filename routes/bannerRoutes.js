const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { handleBannerUpload } = require('../middleware/upload');
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} = require('../controllers/bannerController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new banner (POST) - requires authentication and file upload
router.post('/', handleBannerUpload, createBanner);

// Get all banners with pagination and filtering (GET) - requires authentication
router.get('/', getAllBanners);

// Get single banner by ID (GET) - requires authentication
router.get('/:id', getBannerById);

// Update banner (PUT) - requires authentication and optional file upload
router.put('/:id', handleBannerUpload, updateBanner);

// Delete banner (DELETE) - requires authentication
router.delete('/:id', deleteBanner);

// Toggle banner active status (PATCH) - requires authentication
router.patch('/:id/toggle-status', toggleBannerStatus);

module.exports = router;
