const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadQuizFromCSV,
  getAllQuizzes,
  getQuizForAttempt,
  submitQuiz,
  updateQuizSettings,deleteQuiz,getQuizStats
} = require('../controllers/quizController');

const { protect, adminOnly } = require('../middleware/authMiddleware');


const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload-csv', protect, upload.single('file'), uploadQuizFromCSV);
router.get('/', protect, getAllQuizzes);
router.get('/take/:id', protect, getQuizForAttempt);
router.post('/submit', protect, submitQuiz);
router.put('/:quizId/manage', protect, updateQuizSettings);
router.delete('/:quizId', protect, deleteQuiz);

router.get('/admin/stats', protect, adminOnly, getQuizStats);

module.exports = router;
