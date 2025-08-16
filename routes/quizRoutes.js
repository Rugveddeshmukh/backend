
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const {
  uploadQuizFromCSV,
  getQuizByCourse,
  getQuizForAttempt,
  submitQuiz,
  updateQuizSettings
} = require('../controllers/quizController');

const { protect } = require('../middleware/authMiddleware');



if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });


router.post('/uploadCSV', protect, upload.single('file'), uploadQuizFromCSV);


router.get('/course/:courseName', protect, getQuizByCourse);


router.get('quiz/take/:id', protect, getQuizForAttempt);


router.post('/submit', protect, submitQuiz);


router.put('/:quizId/manage', protect, updateQuizSettings);

module.exports = router;
