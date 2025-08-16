// const User = require('../models/User');
// const OTP = require('../models/OTP');
// const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail');

// // 📩 Send OTP to user email
// exports.sendOtp = async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email required' });

//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

//   await OTP.findOneAndUpdate(
//     { email },
//     { email, code: otpHash, expiresAt: Date.now() + 5 * 60 * 1000 },
//     { upsert: true }
//   );

//   await sendEmail(email, 'Login OTP', `Your OTP code is: ${otpCode}`);
//   res.status(200).json({ message: 'OTP sent to email' });
// };

// // ✅ Verify OTP and login or register user
// exports.verifyOtp = async (req, res) => {
//   const { email, code } = req.body;
//   if (!email || !code) return res.status(400).json({ message: 'Email and OTP code required' });

//   const otpRecord = await OTP.findOne({ email });
//   if (!otpRecord || Date.now() > otpRecord.expiresAt)
//     return res.status(400).json({ message: 'OTP expired or invalid' });

//   const codeHash = crypto.createHash('sha256').update(code).digest('hex');
//   if (codeHash !== otpRecord.code)
//     return res.status(400).json({ message: 'Incorrect OTP' });

//   // Create new user if doesn't exist
//   const user = await User.findOneAndUpdate(
//     { email },
//     {
//       $setOnInsert: {
//         email,
//         fullName: '',
//         role: 'user',
//         isApproved: false,
//         isBlocked: false
//       }
//     },
//     { new: true, upsert: true }
//   );

//   // Block login if user is not approved or is blocked
//   if (user.isBlocked)
//     return res.status(403).json({ message: 'Your account has been blocked by admin.' });

//   if (!user.isApproved)
//     return res.status(403).json({ message: 'Your account is not yet approved by admin.' });

//   // Generate JWT
//   const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//     expiresIn: '1d',
//   });

//   // Record login time and IP (optional)
//   const ip = req.ip || req.connection.remoteAddress;
//   const device = req.headers['user-agent'] || 'unknown';

//   user.loginHistory.push({ ip, device, timestamp: new Date() });
//   await user.save();

//   await OTP.deleteOne({ email });

//   res.status(200).json({
//     message: 'Login successful',
//     token,
//     user: {
//       _id: user._id,
//       email: user.email,
//       role: user.role,
//       fullName: user.fullName,
//       isApproved: user.isApproved
//     }
//   });
// };

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
exports.register = async (req, res) => {
  const { fullName, email, password, dateOfBirth } = req.body;

  if (!fullName || !email || !password || !dateOfBirth) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      dateOfBirth,
      role: 'user', 
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });


    // Add login history
    const ip = req.ip || req.connection.remoteAddress;
    const device = req.headers["user-agent"] || "Unknown Device";

    user.loginHistory.push({ ip, device, timestamp: new Date() });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    

    res.status(200).json({ token, user });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};
