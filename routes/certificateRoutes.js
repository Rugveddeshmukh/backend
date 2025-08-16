const express = require('express');
const {
  issueCertificate,
  getCertificatesByUser
} = require('../controllers/certificateController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, adminOnly, issueCertificate);
router.get('/my', protect, getCertificatesByUser);

module.exports = router;