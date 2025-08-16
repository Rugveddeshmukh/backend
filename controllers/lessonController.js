const Lesson = require('../models/Lesson');
const cloudinary = require('../config/cloudinary');

exports.uploadLesson = async (req, res) => {
  try {
    const { courseId, title } = req.body;

    const pptFile = req.files?.ppt?.[0] || null;
    const thumbnailFile = req.files?.thumbnail?.[0] || null;

    if (!pptFile || !thumbnailFile) {
      return res.status(400).json({ message: 'PPT and thumbnail are required' });
    }

    // multer-storage-cloudinary adds these fields:
    // - path: absolute URL to the resource on Cloudinary
    // - filename: Cloudinary public_id
    // - resource_type: "raw" for docs, "image" for thumbnails
    const newLesson = new Lesson({
      courseId,
      title: title || '',
      ppt: pptFile.path,
      thumbnail: thumbnailFile.path,
      pptPublicId: pptFile.filename,
      thumbnailPublicId: thumbnailFile.filename,
    });

    await newLesson.save();
    res.status(201).json(newLesson);
  } catch (err) {
    console.error('uploadLesson error:', err);
    res.status(500).json({ message: 'Lesson upload failed' });
  }
};

exports.getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId })
      .sort({ createdAt: -1 });
    res.json(lessons);
  } catch (err) {
    console.error('getLessonsByCourse error:', err);
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    // Delete assets on Cloudinary (ignore errors but log them)
    try {
      if (lesson.thumbnailPublicId) {
        await cloudinary.uploader.destroy(lesson.thumbnailPublicId, { resource_type: 'image' });
      }
      if (lesson.pptPublicId) {
        await cloudinary.uploader.destroy(lesson.pptPublicId, { resource_type: 'raw' });
      }
    } catch (e) {
      console.warn('Cloudinary delete warning:', e?.message || e);
    }

    await Lesson.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Lesson deleted' });
  } catch (err) {
    console.error('deleteLesson error:', err);
    res.status(500).json({ message: 'Failed to delete lesson' });
  }
};
