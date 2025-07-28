const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// Create a new banner
const createBanner = async (req, res) => {
  try {
    const { title, description, isActive } = req.body;

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
      title,
      description,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.userId
    });

    await banner.save();

    // Populate creator info
    await banner.populate('createdBy', 'name email');

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

// Get all banners with pagination
const getAllBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Get banners with pagination
    const banners = await Banner.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Banner.countDocuments(filter);

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

    const banner = await Banner.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

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
    const { title, description, isActive } = req.body;

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

    // Update fields
    if (title !== undefined) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (isActive !== undefined) banner.isActive = isActive;
    banner.updatedBy = req.user.userId;

    // Handle image update
    if (req.file) {
      // Extract filename from current imageUrl for deletion
      const currentFileName = banner.imageUrl.split('/').pop();
      const oldImagePath = path.join(__dirname, '../uploads/banners', currentFileName);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      // Update with new image
      banner.imageUrl = `/api/uploads/banners/${req.file.filename}`;
    }

    await banner.save();

    // Populate user info
    await banner.populate('createdBy', 'name email');
    await banner.populate('updatedBy', 'name email');

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

    // Extract filename from imageUrl for deletion
    const fileName = banner.imageUrl.split('/').pop();
    const imagePath = path.join(__dirname, '../uploads/banners', fileName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
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

// Toggle banner active status
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    banner.updatedBy = req.user.userId;
    await banner.save();

    await banner.populate('createdBy', 'name email');
    await banner.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });

  } catch (error) {
    console.error('Toggle Banner Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner status',
      error: error.message
    });
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
};
