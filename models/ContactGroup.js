const mongoose = require('mongoose');

const contactGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  contactIds: {
    type: [String],
    default: [],
    validate: {
      validator: function(array) {
        return array.length > 0;
      },
      message: 'Contact group must have at least one contact'
    }
  },
  color: {
    type: String,
    default: '#2196F3', // Default blue color
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
contactGroupSchema.index({ userId: 1, createdAt: -1 });
contactGroupSchema.index({ userId: 1, name: 1 }, { unique: true });

// Virtual for contact count
contactGroupSchema.virtual('contactCount').get(function() {
  return this.contactIds.length;
});

// Ensure virtual fields are serialized
contactGroupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ContactGroup', contactGroupSchema);
