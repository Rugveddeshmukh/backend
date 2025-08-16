const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject: req.body.subject,
      message: req.body.message,
      screenshot: req.body.screenshot
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Support ticket failed' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    ticket.replies.push({ sender: 'admin', message: req.body.message });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to reply' });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load tickets' });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().populate('userId');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all tickets' });
  }
};
