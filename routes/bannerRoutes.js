const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { handleBannerUpload, handleMultipleBannerUpload } = require('../middleware/upload');
const {
  createBanner,
  createMultipleBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new banner (POST) - requires authentication and file upload
router.post('/', handleBannerUpload, createBanner);

// Create multiple banners (POST) - requires authentication and multiple file upload
router.post('/multiple', handleMultipleBannerUpload, createMultipleBanners);

// Get all banners with pagination and filtering (GET) - requires authentication
router.get('/', getAllBanners);

// Get single banner by ID (GET) - requires authentication
router.get('/:id', getBannerById);

// Update banner (PUT) - requires authentication and optional file upload
router.put('/:id', handleBannerUpload, updateBanner);

// Delete banner (DELETE) - requires authentication
router.delete('/:id', deleteBanner);

module.exports = router;
