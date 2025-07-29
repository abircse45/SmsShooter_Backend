const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// Create a new banner
const createBanner = async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }

    // Create image URL
    const imageUrl = `/api/uploads/banners/${req.file.filename}`;

    // Create new banner
    const banner = new Banner({
      imageUrl
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });

  } catch (error) {
    // Delete uploaded file if banner creation fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/banners', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.error('Create Banner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
};

// Create multiple banners
const createMultipleBanners = async (req, res) => {
  try {
    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one banner image is required'
      });
    }

    // Create image URLs array
    const imageUrls = req.files.map(file => `/api/uploads/banners/${file.filename}`);

    // Create new banner with multiple images
    const banner = new Banner({
      imageUrls
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: `${req.files.length} banner images uploaded successfully`,
      data: banner
    });

  } catch (error) {
    // Delete uploaded files if banner creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads/banners', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    console.error('Create Multiple Banners Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banners',
      error: error.message
    });
  }
};

// Get all banners with pagination
const getAllBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get banners with pagination
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Banner.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Banners retrieved successfully',
      data: banners,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get All Banners Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banners',
      error: error.message
    });
  }
};

// Get single banner by ID
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner retrieved successfully',
      data: banner
    });

  } catch (error) {
    console.error('Get Banner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banner',
      error: error.message
    });
  }
};

// Update banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing banner
    const banner = await Banner.findById(id);
    if (!banner) {
      // Delete uploaded file if banner not found
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/banners', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Handle image update
    if (req.file) {
      // Delete old image(s) 
      if (banner.imageUrl) {
        const currentFileName = banner.imageUrl.split('/').pop();
        const oldImagePath = path.join(__dirname, '../uploads/banners', currentFileName);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      if (banner.imageUrls && banner.imageUrls.length > 0) {
        banner.imageUrls.forEach(imageUrl => {
          const fileName = imageUrl.split('/').pop();
          const oldImagePath = path.join(__dirname, '../uploads/banners', fileName);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        });
      }

      // Update with new image
      banner.imageUrl = `/api/uploads/banners/${req.file.filename}`;
      banner.imageUrls = []; // Clear multiple images when updating with single image
      await banner.save();
    }

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });

  } catch (error) {
    // Delete uploaded file if update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/banners', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.error('Update Banner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

// Delete banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete single image if exists
    if (banner.imageUrl) {
      const fileName = banner.imageUrl.split('/').pop();
      const imagePath = path.join(__dirname, '../uploads/banners', fileName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete multiple images if exist
    if (banner.imageUrls && banner.imageUrls.length > 0) {
      banner.imageUrls.forEach(imageUrl => {
        const fileName = imageUrl.split('/').pop();
        const imagePath = path.join(__dirname, '../uploads/banners', fileName);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    // Delete banner from database
    await Banner.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Delete Banner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
};

module.exports = {
  createBanner,
  createMultipleBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
};
