// const mongoose = require('mongoose');

// const loginHistorySchema = new mongoose.Schema({
//   timestamp: { type: Date, default: Date.now },
//   ip: String,
//   device: String
// });

// const userSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   birthdate: {
//     type: Date
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin'],
//     default: 'user'
//   },
//   isApproved: {
//     type: Boolean,
//     default: false // must be approved by admin before dashboard access
//   },
//   isBlocked: {
//     type: Boolean,
//     default: false // for suspending access
//   },
//   certificates: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Certificate'
//   }],
//   loginHistory: [loginHistorySchema],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  ip: String,
  device: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  loginHistory: [loginHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
