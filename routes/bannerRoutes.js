const express = require('express');
const router = express.Router();
const { handleBannerUpload, handleMultipleBannerUpload } = require('../middleware/upload');
const {
  createBanner,
  createMultipleBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');

// Create new banner (POST)
router.post('/', handleBannerUpload, createBanner);

// Create multiple banners (POST)
router.post('/multiple', handleMultipleBannerUpload, createMultipleBanners);

// Get all banners with pagination and filtering (GET)
router.get('/', getAllBanners);

// Get single banner by ID (GET)
router.get('/:id', getBannerById);

// Update banner (PUT)
router.put('/:id', handleBannerUpload, updateBanner);

// Delete banner (DELETE)
router.delete('/:id', deleteBanner);

module.exports = router;
