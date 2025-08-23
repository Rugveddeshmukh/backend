const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadQuizFromCSV,
  getAllQuizzes,
  getQuizForAttempt,
  submitQuiz,
  updateQuizSettings
} = require('../controllers/quizController');

const { protect } = require('../middleware/authMiddleware');

// Use memory storage so we can parse + upload to Cloudinary without touching disk
const upload = multer({ storage: multer.memoryStorage() });

// ADMIN: upload CSV (file field name = "file")
router.post('/upload-csv', protect, upload.single('file'), uploadQuizFromCSV);

// USER/ADMIN: get quizzes by course (ID or Name)
router.get('/', protect, getAllQuizzes);

// USER: get quiz data for attempting
router.get('/take/:id', protect, getQuizForAttempt);

// USER: submit quiz answers
router.post('/submit', protect, submitQuiz);

// ADMIN: manage quiz settings
router.put('/:quizId/manage', protect, updateQuizSettings);

module.exports = router;
