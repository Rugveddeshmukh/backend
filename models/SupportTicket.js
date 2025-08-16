const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  screenshot: String,
  status: { type: String, default: 'open' },
  replies: [
    {
      sender: String, // 'admin' or 'user'
      message: String,
      sentAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
