const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true // This will be a hashed OTP
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('OTP', otpSchema);
