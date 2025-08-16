const Course = require('../models/Course');

exports.createCourse = async (req, res) => {
  try {
    const { category, subcategory, title } = req.body;
    const course = new Course({ category, subcategory, title });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: 'Error creating course' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Course.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await Course.find({ category: req.params.category }).distinct('subcategory');
    res.json(subcategories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting course' });
  }
};
