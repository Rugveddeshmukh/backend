const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: { type: String, required: false },

  // Store absolute Cloudinary URLs
  ppt: { type: String, required: true },
  thumbnail: { type: String, required: true },

  // For safe deletion on Cloudinary
  pptPublicId: { type: String, required: true },
  thumbnailPublicId: { type: String, required: true },
}, { timestamps: true });


module.exports = mongoose.model('Lesson', lessonSchema);
