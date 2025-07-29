const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: function() {
      return !this.imageUrls || this.imageUrls.length === 0;
    }
  },
  imageUrls: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
bannerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Banner', bannerSchema);
