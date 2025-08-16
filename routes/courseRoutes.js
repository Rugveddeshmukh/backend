const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCategories,
  getSubcategories,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createCourse);
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/subcategories/:category', getSubcategories);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

module.exports = router;
