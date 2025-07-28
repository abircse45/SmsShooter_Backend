const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getScheduledCampaigns,
  cancelScheduledCampaign
} = require('../controllers/campaignController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Campaign CRUD routes
router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/analytics', getCampaignAnalytics);
router.get('/scheduled', getScheduledCampaigns);
router.get('/:id', getCampaignById);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

// Campaign action routes
router.post('/:id/send', sendCampaign);
router.post('/:id/cancel', cancelScheduledCampaign);

module.exports = router;
