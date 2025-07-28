const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

// Create a new campaign
const createCampaign = async (req, res) => {
  try {
    const {
      name,
      message,
      recipientNumbers,
      targetInventory,
      audienceType,
      campaignPurpose,
      selectedCountries,
      tags,
      isFromCsv,
      csvFileName,
      contactSourceInfo,
      isScheduled,
      scheduledDateTime
    } = req.body;

    // Validation
    if (!name || !message || !recipientNumbers || recipientNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name, message, and recipient numbers are required'
      });
    }

    // Create campaign
    const campaign = new Campaign({
      name,
      message,
      userId: req.user.userId,
      recipientNumbers,
      totalRecipients: recipientNumbers.length,
      targetInventory,
      audienceType,
      campaignPurpose,
      selectedCountries: selectedCountries || [],
      tags,
      isFromCsv: isFromCsv || false,
      csvFileName,
      contactSourceInfo,
      isScheduled: isScheduled || false,
      scheduledDateTime: isScheduled ? new Date(scheduledDateTime) : null,
      status: isScheduled ? 'scheduled' : 'draft'
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          message: campaign.message,
          totalRecipients: campaign.totalRecipients,
          status: campaign.status,
          isScheduled: campaign.isScheduled,
          scheduledDateTime: campaign.scheduledDateTime,
          createdAt: campaign.createdAt,
          successRate: campaign.successRate
        }
      }
    });
  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
};

// Get all campaigns for a user
const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const userId = req.user.userId;

    // Build filter
    const filter = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messageStatuses -recipientNumbers');

    const total = await Campaign.countDocuments(filter);

    // Add virtual success rate to each campaign
    const campaignsWithStats = campaigns.map(campaign => ({
      ...campaign.toObject(),
      successRate: campaign.successRate
    }));

    res.json({
      success: true,
      data: {
        campaigns: campaignsWithStats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get Campaigns Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaigns',
      error: error.message
    });
  }
};

// Get a single campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const campaign = await Campaign.findOne({ _id: id, userId });
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: {
        campaign: {
          ...campaign.toObject(),
          successRate: campaign.successRate
        }
      }
    });
  } catch (error) {
    console.error('Get Campaign Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign',
      error: error.message
    });
  }
};

// Update a campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    // Don't allow updating certain fields if campaign is already sending or completed
    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (['sending', 'completed'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update campaign that is sending or completed'
      });
    }

    // Update recipient count if numbers changed
    if (updateData.recipientNumbers) {
      updateData.totalRecipients = updateData.recipientNumbers.length;
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: {
        campaign: {
          ...updatedCampaign.toObject(),
          successRate: updatedCampaign.successRate
        }
      }
    });
  } catch (error) {
    console.error('Update Campaign Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      error: error.message
    });
  }
};

// Delete a campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Don't allow deleting if campaign is currently sending
    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign that is currently sending'
      });
    }

    await Campaign.deleteOne({ _id: id, userId });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete Campaign Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
};

// Send campaign messages (simulate SMS sending)
const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Campaign already completed'
      });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is already being sent'
      });
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.startedAt = new Date();
    await campaign.save();

    // Simulate sending messages (replace with actual SMS service)
    const results = await simulateMessageSending(campaign);

    // Update campaign with results
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    campaign.messageStatuses = results;
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign sent successfully',
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          sentCount: campaign.sentCount,
          deliveredCount: campaign.deliveredCount,
          failedCount: campaign.failedCount,
          successRate: campaign.successRate
        }
      }
    });
  } catch (error) {
    console.error('Send Campaign Error:', error);
    
    // Update campaign status to failed if there was an error
    try {
      await Campaign.findByIdAndUpdate(req.params.id, { 
        status: 'failed',
        completedAt: new Date()
      });
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send campaign',
      error: error.message
    });
  }
};

// Get campaign analytics
const getCampaignAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'today' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        };
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = {
          createdAt: {
            $gte: weekStart,
            $lt: new Date()
          }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        };
        break;
    }

    const campaigns = await Campaign.find({ userId, ...dateFilter });

    const analytics = {
      totalCampaigns: campaigns.length,
      totalRecipients: campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0),
      totalSent: campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0),
      totalDelivered: campaigns.reduce((sum, campaign) => sum + campaign.deliveredCount, 0),
      totalFailed: campaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0),
      averageSuccessRate: campaigns.length > 0 
        ? (campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.successRate), 0) / campaigns.length).toFixed(2)
        : 0,
      statusBreakdown: {
        draft: campaigns.filter(c => c.status === 'draft').length,
        scheduled: campaigns.filter(c => c.status === 'scheduled').length,
        sending: campaigns.filter(c => c.status === 'sending').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        failed: campaigns.filter(c => c.status === 'failed').length,
        cancelled: campaigns.filter(c => c.status === 'cancelled').length
      }
    };

    res.json({
      success: true,
      data: {
        period,
        analytics
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
};

// Get scheduled campaigns
const getScheduledCampaigns = async (req, res) => {
  try {
    const userId = req.user.userId;

    const scheduledCampaigns = await Campaign.find({
      userId,
      status: 'scheduled',
      scheduledDateTime: { $gte: new Date() }
    })
    .sort({ scheduledDateTime: 1 })
    .select('-messageStatuses -recipientNumbers');

    res.json({
      success: true,
      data: {
        scheduledCampaigns
      }
    });
  } catch (error) {
    console.error('Get Scheduled Campaigns Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve scheduled campaigns',
      error: error.message
    });
  }
};

// Cancel a scheduled campaign
const cancelScheduledCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled campaigns can be cancelled'
      });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    res.json({
      success: true,
      message: 'Scheduled campaign cancelled successfully',
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status
        }
      }
    });
  } catch (error) {
    console.error('Cancel Campaign Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel campaign',
      error: error.message
    });
  }
};

// Simulate message sending (replace with actual SMS service integration)
const simulateMessageSending = async (campaign) => {
  const results = [];
  
  for (const phoneNumber of campaign.recipientNumbers) {
    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    const now = new Date();
    
    if (isSuccess) {
      results.push({
        phoneNumber,
        status: 'delivered',
        sentAt: now,
        deliveredAt: new Date(now.getTime() + Math.random() * 10000) // Random delivery time
      });
    } else {
      results.push({
        phoneNumber,
        status: 'failed',
        sentAt: now,
        errorMessage: 'Network error or invalid number'
      });
    }
    
    // Add small delay to simulate real sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getScheduledCampaigns,
  cancelScheduledCampaign
};
