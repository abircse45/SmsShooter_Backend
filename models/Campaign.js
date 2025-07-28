const mongoose = require('mongoose');

const messageStatusSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientNumbers: [{
    type: String,
    required: true
  }],
  totalRecipients: {
    type: Number,
    required: true
  },
  
  // Campaign Settings
  targetInventory: {
    type: String,
    enum: ['A', 'B', 'C', 'D']
  },
  audienceType: {
    type: String,
    enum: [
      'General Public',
      'Business Professionals', 
      'Students',
      'Senior Citizens',
      'Young Adults',
      'Families',
      'Tech Enthusiasts',
      'Healthcare Workers'
    ]
  },
  campaignPurpose: {
    type: String,
    enum: [
      'Marketing',
      'Promotional',
      'Informational',
      'Emergency Alert',
      'Event Notification',
      'Survey',
      'Reminder',
      'Customer Service'
    ]
  },
  selectedCountries: [{
    type: String
  }],
  tags: {
    type: String
  },
  
  // Contact Source Info
  isFromCsv: {
    type: Boolean,
    default: false
  },
  csvFileName: {
    type: String
  },
  contactSourceInfo: {
    type: String
  },
  
  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'],
    default: 'draft'
  },
  
  // Scheduling
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDateTime: {
    type: Date
  },
  
  // Execution Info
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
  // Message Delivery Status
  messageStatuses: [messageStatusSchema],
  
  // Statistics
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  pendingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for performance
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ scheduledDateTime: 1 });
campaignSchema.index({ createdAt: -1 });

// Virtual for success rate
campaignSchema.virtual('successRate').get(function() {
  if (this.totalRecipients === 0) return 0;
  return ((this.deliveredCount / this.totalRecipients) * 100).toFixed(2);
});

// Method to update statistics
campaignSchema.methods.updateStats = function() {
  this.sentCount = this.messageStatuses.filter(status => status.status === 'sent' || status.status === 'delivered').length;
  this.deliveredCount = this.messageStatuses.filter(status => status.status === 'delivered').length;
  this.failedCount = this.messageStatuses.filter(status => status.status === 'failed').length;
  this.pendingCount = this.messageStatuses.filter(status => status.status === 'pending').length;
};

// Pre-save middleware to update stats
campaignSchema.pre('save', function(next) {
  if (this.messageStatuses && this.messageStatuses.length > 0) {
    this.updateStats();
  } else {
    // Initialize message statuses for new campaigns
    if (this.isNew && this.recipientNumbers && this.recipientNumbers.length > 0) {
      this.messageStatuses = this.recipientNumbers.map(phoneNumber => ({
        phoneNumber,
        status: 'pending'
      }));
      this.pendingCount = this.recipientNumbers.length;
    }
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
