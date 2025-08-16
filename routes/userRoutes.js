const express = require('express');
const {
  getUserDashboard,
  updateProfile,
  getLoginHistory,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getUserDashboard);

router.put('/profile', protect, updateProfile);

router.get('/login-history', protect, getLoginHistory);

module.exports = router;
