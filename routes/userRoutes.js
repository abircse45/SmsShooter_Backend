const express = require('express');
const router = express.Router();
const { 
  googleSignIn, 
  getAllUsers, 
  getSingleUser, 
  getUserProfile 
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/google-signin', googleSignIn);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getUserProfile);
router.get('/all', authenticateToken, getAllUsers);
router.get('/:userId', authenticateToken, getSingleUser);

module.exports = router;
