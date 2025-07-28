const ContactGroup = require('../models/ContactGroup');
const mongoose = require('mongoose');

// Create a new contact group
const createContactGroup = async (req, res) => {
  try {
    const { name, description, contactIds, color } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one contact is required'
      });
    }

    // Check if group name already exists for this user
    const existingGroup = await ContactGroup.findOne({ 
      userId, 
      name: name.trim(),
      isActive: true 
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'A group with this name already exists'
      });
    }

    // Create new group
    const newGroup = new ContactGroup({
      name: name.trim(),
      description: description?.trim() || null,
      contactIds: [...new Set(contactIds)], // Remove duplicates
      color: color || '#2196F3',
      userId
    });

    const savedGroup = await newGroup.save();

    res.status(201).json({
      success: true,
      message: 'Contact group created successfully',
      data: savedGroup
    });

  } catch (error) {
    console.error('Error creating contact group:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all contact groups for a user
const getAllContactGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = { userId, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [groups, totalCount] = await Promise.all([
      ContactGroup.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ContactGroup.countDocuments(query)
    ]);

    // Add contact count to each group
    const groupsWithCount = groups.map(group => ({
      ...group,
      contactCount: group.contactIds.length
    }));

    res.status(200).json({
      success: true,
      message: 'Contact groups retrieved successfully',
      data: {
        groups: groupsWithCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching contact groups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get a single contact group
const getSingleContactGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await ContactGroup.findOne({
      _id: groupId,
      userId,
      isActive: true
    }).lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Contact group not found'
      });
    }

    // Add contact count
    const groupWithCount = {
      ...group,
      contactCount: group.contactIds.length
    };

    res.status(200).json({
      success: true,
      message: 'Contact group retrieved successfully',
      data: groupWithCount
    });

  } catch (error) {
    console.error('Error fetching contact group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update a contact group
const updateContactGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const { name, description, contactIds, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    // Find the group
    const group = await ContactGroup.findOne({
      _id: groupId,
      userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Contact group not found'
      });
    }

    // Check if new name conflicts with existing group (if name is being changed)
    if (name && name.trim() !== group.name) {
      const existingGroup = await ContactGroup.findOne({
        userId,
        name: name.trim(),
        isActive: true,
        _id: { $ne: groupId }
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'A group with this name already exists'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (contactIds !== undefined) {
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one contact is required'
        });
      }
      updateData.contactIds = [...new Set(contactIds)]; // Remove duplicates
    }
    if (color !== undefined) updateData.color = color;

    const updatedGroup = await ContactGroup.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    // Add contact count
    const groupWithCount = {
      ...updatedGroup,
      contactCount: updatedGroup.contactIds.length
    };

    res.status(200).json({
      success: true,
      message: 'Contact group updated successfully',
      data: groupWithCount
    });

  } catch (error) {
    console.error('Error updating contact group:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a contact group (soft delete)
const deleteContactGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await ContactGroup.findOne({
      _id: groupId,
      userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Contact group not found'
      });
    }

    // Soft delete
    await ContactGroup.findByIdAndUpdate(groupId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Contact group deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add contacts to a group
const addContactsToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { contactIds } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs are required'
      });
    }

    const group = await ContactGroup.findOne({
      _id: groupId,
      userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Contact group not found'
      });
    }

    // Add new contacts (avoid duplicates)
    const existingContactIds = new Set(group.contactIds);
    const newContactIds = contactIds.filter(id => !existingContactIds.has(id));
    
    if (newContactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All contacts are already in this group'
      });
    }

    const updatedGroup = await ContactGroup.findByIdAndUpdate(
      groupId,
      { $addToSet: { contactIds: { $each: newContactIds } } },
      { new: true }
    ).lean();

    res.status(200).json({
      success: true,
      message: `${newContactIds.length} contact(s) added to group`,
      data: {
        ...updatedGroup,
        contactCount: updatedGroup.contactIds.length
      }
    });

  } catch (error) {
    console.error('Error adding contacts to group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove contacts from a group
const removeContactsFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { contactIds } = req.body;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs are required'
      });
    }

    const group = await ContactGroup.findOne({
      _id: groupId,
      userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Contact group not found'
      });
    }

    // Check if removing contacts would make group empty
    const remainingContacts = group.contactIds.filter(id => !contactIds.includes(id));
    if (remainingContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove all contacts from group. Delete the group instead.'
      });
    }

    const updatedGroup = await ContactGroup.findByIdAndUpdate(
      groupId,
      { $pull: { contactIds: { $in: contactIds } } },
      { new: true }
    ).lean();

    res.status(200).json({
      success: true,
      message: 'Contacts removed from group',
      data: {
        ...updatedGroup,
        contactCount: updatedGroup.contactIds.length
      }
    });

  } catch (error) {
    console.error('Error removing contacts from group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get group statistics
const getGroupStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await ContactGroup.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalGroups: { $sum: 1 },
          totalContacts: { $sum: { $size: '$contactIds' } },
          recentGroups: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          avgContactsPerGroup: { $avg: { $size: '$contactIds' } }
        }
      }
    ]);

    const result = stats[0] || {
      totalGroups: 0,
      totalContacts: 0,
      recentGroups: 0,
      avgContactsPerGroup: 0
    };

    res.status(200).json({
      success: true,
      message: 'Group statistics retrieved successfully',
      data: {
        totalGroups: result.totalGroups,
        totalContacts: result.totalContacts,
        recentGroups: result.recentGroups,
        avgContactsPerGroup: Math.round(result.avgContactsPerGroup * 10) / 10
      }
    });

  } catch (error) {
    console.error('Error fetching group stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createContactGroup,
  getAllContactGroups,
  getSingleContactGroup,
  updateContactGroup,
  deleteContactGroup,
  addContactsToGroup,
  removeContactsFromGroup,
  getGroupStats
};
