const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  issuedDate: Date,
  certificateUrl: String
});

module.exports = mongoose.model('Certificate', certificateSchema);
