const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer'); 
const upload = multer({ storage: multer.memoryStorage() });


router.post('/', protect, upload.single('screenshot'), ticketController.createTicket);

router.get('/mytickets', protect, ticketController.getUserTickets);

router.get('/', protect, adminOnly, ticketController.getAllTickets);

router.put('/:id/reply', protect, adminOnly, ticketController.replyTicket);

router.put('/:id/close', protect, adminOnly, ticketController.closeTicket);

router.delete('/:id', protect, adminOnly, ticketController.deleteTicket);

router.get('/count', protect, adminOnly, ticketController.getTicketsCount);


module.exports = router;
