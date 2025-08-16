const express = require('express');
const upload = require('../middleware/fileUpload');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  res.json({ filePath: req.file.path });
});

module.exports = router;
