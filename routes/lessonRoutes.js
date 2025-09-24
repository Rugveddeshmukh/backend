const express = require('express');
const { uploadLesson, getLessonsByCourse, deleteLesson,updateLessonProgress,getAllLessons,
  } = require('../controllers/lessonController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');

const router = express.Router();

router.post(
  '/',
  protect,adminOnly,
  upload.fields([
    { name: 'ppt', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  uploadLesson
);

router.get('/:courseId', protect, getLessonsByCourse);
router.delete('/:id', protect, adminOnly, deleteLesson);
router.put('/:id/progress', protect, updateLessonProgress);
router.get('/', protect, adminOnly, getAllLessons);




module.exports = router;
