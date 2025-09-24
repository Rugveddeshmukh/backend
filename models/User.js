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
  deviceType: { type: String, default: "Unknown" },
  location: { type: String, default: "Unknown" },
  timestamp: { type: Date, default: Date.now },  
  status: { type: String, enum: ["Success", "Failure"], default: "Success" }, 
});

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true },                 
  teamLeader: { type: String },                                 
  designation: { type: String },              
  password: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  isBlocked: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  loginHistory: [loginHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
