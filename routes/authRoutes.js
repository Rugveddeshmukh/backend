// const express = require('express');
// const { sendOtp, verifyOtp } = require('../controllers/authController');

// const router = express.Router();

// router.post('/send-otp', sendOtp);

// router.post('/verify-otp', verifyOtp);

// module.exports = router;

const express = require('express');
const { register, login, getProfile,approveUser } = require('../controllers/authController');
const {protect,} = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);


module.exports = router;

