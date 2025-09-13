// const express = require('express');
// const {
//   getUserDashboard,
//   updateProfile,
//   getLoginHistory,
// } = require('../controllers/userController');
// const { protect } = require('../middleware/authMiddleware');

// const router = express.Router();

// router.get('/dashboard', protect, getUserDashboard);

// router.put('/profile', protect, updateProfile);

// router.get('/login-history', protect, getLoginHistory);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getLearningHistory } = require('../controllers/userController');

router.get('/learning-history', protect, getLearningHistory);

module.exports = router;

