const express = require('express');
const {
  createTicket,
  replyToTicket,
  getUserTickets,
  getAllTickets
} = require('../controllers/supportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, createTicket);
router.get('/my', protect, getUserTickets);
router.get('/all', protect, adminOnly, getAllTickets);
router.post('/reply/:id', protect, adminOnly, replyToTicket);

module.exports = router;
