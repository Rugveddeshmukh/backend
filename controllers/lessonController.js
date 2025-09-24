const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const cloudinary = require('../config/cloudinary');
const LessonProgress =require('../models/LessonProgress')

exports.uploadLesson = async (req, res) => {
  try {
    const { courseId, title, } = req.body;

    const pptFile = req.files?.ppt?.[0] || null;
    const thumbnailFile = req.files?.thumbnail?.[0] || null;

    if (!pptFile || !thumbnailFile) {
      return res.status(400).json({ message: 'PPT and thumbnail are required' });
    }

    // - multer-storage-cloudinary adds these fields:
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
      startDate: new Date(),   
      endDate: null
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
    const courseId = req.params.courseId;
    const userId = req.user?.id; // protect middleware must set req.user

    const lessons = await Lesson.find({ courseId })
      .sort({ createdAt: -1 })
      .lean(); // lean so we can mutate easily

    // if no user (shouldn't happen if protected), attach default statuses
    if (!userId) {
      const withDefault = lessons.map(l => ({ ...l, userStatus: 'not-started' }));
      return res.json(withDefault);
    }

    const lessonIds = lessons.map(l => l._id);

    const progresses = await LessonProgress.find({
      userId,
      lessonId: { $in: lessonIds }
    }).lean();

    const progressMap = {};
    progresses.forEach(p => {
      progressMap[p.lessonId.toString()] = p.status;
    });

    const result = lessons.map(l => ({
      ...l,
      userStatus: progressMap[l._id.toString()] || 'not-started'
    }));

    res.json(result);
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

exports.updateLessonProgress = async (req, res) => {
  try {
    const { id } = req.params; // lesson id
    const { status } = req.body; // in-progress / completed / not-started
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!["not-started", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ensure lesson exists
    const lessonExists = await Lesson.exists({ _id: id });
    if (!lessonExists) return res.status(404).json({ message: "Lesson not found" });

    const progress = await LessonProgress.findOneAndUpdate(
      { lessonId: id, userId },
      { status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (status === "completed") {
      await Lesson.findByIdAndUpdate(id, { endDate: new Date() });
    }

    res.json({ lessonId: id, userStatus: progress.status });
  } catch (err) {
    console.error("updateLessonProgress error:", err);
    res.status(500).json({ message: "Failed to update progress" });
  }
};

// Fetch all lessons (for admin)
exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: -1 }).lean();
    res.json(lessons);
  } catch (err) {
    console.error('getAllLessons error:', err);
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
};
