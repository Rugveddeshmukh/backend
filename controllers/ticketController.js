const Ticket = require('../models/Ticket');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');


// Create Ticket
exports.createTicket = async (req, res) => {
  try {
    let screenshotUrl = '';

    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'tickets/screenshots' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req.file.buffer);
      screenshotUrl = result.secure_url;
    }

    const ticket = await Ticket.create({
      userId: req.user.id,
      subject: req.body.subject,
      description: req.body.description,
      screenshot: screenshotUrl
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get user's tickets
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('userId', 'fullName email');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin reply
exports.replyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if(!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.adminResponse = req.body.reply;
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin close ticket
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if(!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'Closed';
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getTicketsCount = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

    res.json({ totalTickets, openTickets, closedTickets });
  } catch (err) {
    console.error('getTicketsCount error:', err);
    res.status(500).json({ message: 'Failed to get tickets count', error: err.message });
  }
};

