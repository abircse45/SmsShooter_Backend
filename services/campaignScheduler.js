const Campaign = require('../models/Campaign');
const cron = require('node-cron');

class CampaignScheduler {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
  }

  start() {
    if (this.isRunning) {
      console.log('Campaign scheduler is already running');
      return;
    }

    console.log('Starting campaign scheduler...');
    this.isRunning = true;

    // Check for scheduled campaigns every minute
    this.checkInterval = cron.schedule('* * * * *', async () => {
      await this.checkScheduledCampaigns();
    }, {
      scheduled: true,
      timezone: "Asia/Dhaka" // Adjust timezone as needed
    });

    console.log('Campaign scheduler started successfully');
  }

  stop() {
    if (this.checkInterval) {
      this.checkInterval.stop();
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Campaign scheduler stopped');
  }

  async checkScheduledCampaigns() {
    try {
      const now = new Date();
      
      // Find campaigns that are scheduled and due to be sent
      const dueCampaigns = await Campaign.find({
        status: 'scheduled',
        scheduledDateTime: { $lte: now }
      });

      console.log(`Found ${dueCampaigns.length} campaigns due for sending`);

      for (const campaign of dueCampaigns) {
        try {
          await this.executeCampaign(campaign);
        } catch (error) {
          console.error(`Failed to execute campaign ${campaign._id}:`, error);
          
          // Mark campaign as failed
          campaign.status = 'failed';
          campaign.completedAt = new Date();
          await campaign.save();
        }
      }
    } catch (error) {
      console.error('Error checking scheduled campaigns:', error);
    }
  }

  async executeCampaign(campaign) {
    console.log(`Executing scheduled campaign: ${campaign.name} (${campaign._id})`);

    // Update campaign status
    campaign.status = 'sending';
    campaign.startedAt = new Date();
    await campaign.save();

    // Simulate sending messages (replace with actual SMS service)
    const results = await this.simulateMessageSending(campaign);

    // Update campaign with results
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    campaign.messageStatuses = results;
    await campaign.save();

    console.log(`Campaign ${campaign.name} completed successfully`);
  }

  // Simulate message sending (replace with actual SMS service integration)
  async simulateMessageSending(campaign) {
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }
}

// Create and export a singleton instance
const campaignScheduler = new CampaignScheduler();

module.exports = campaignScheduler;
