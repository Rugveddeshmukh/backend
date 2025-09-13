// const User = require('../models/User');
// const Quiz = require('../models/Quiz'); // Required for aggregation

// // ✅ User dashboard metrics
// exports.getUserDashboard = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId)
//       .populate('coursesEnrolled') 
//       .populate({
//         path: 'certificates',
//         populate: { path: 'courseId', model: 'Course' }
//       });

//     const completedCourses = user.certificates?.length || 0;
//     const inProgressCourses = (user.coursesEnrolled?.length || 0) - completedCourses;

//     const quizAttempts = await Quiz.aggregate([
//       { $unwind: '$attempts' },
//       { $match: { 'attempts.userId': user._id } },
//       {
//         $group: {
//           _id: '$attempts.status',
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const pendingAction = user.coursesEnrolled?.length
//       ? `Continue Course: ${user.coursesEnrolled[0].title}`
//       : 'No active course yet';

//     res.json({
//       fullName: user.fullName,
//       certificatesEarned: completedCourses,
//       courses: {
//         completed: completedCourses,
//         inProgress: inProgressCourses,
//       },
//       quizStats: quizAttempts,
//       nextPendingAction: pendingAction,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to fetch dashboard' });
//   }
// };

// // ✅ Update profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const updates = req.body;
//     const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
//     res.json(updatedUser);
//   } catch (err) {
//     res.status(500).json({ message: 'Profile update failed' });
//   }
// };

// // ✅ View login history
// exports.getLoginHistory = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.json(user.loginHistory || []);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not fetch login history' });
//   }
// };

// // ✅ Record login history (called manually or during login)
// exports.recordLogin = async (userId, ip, device) => {
//   try {
//     await User.findByIdAndUpdate(userId, {
//       $push: {
//         loginHistory: {
//           ip,
//           device,
//           timestamp: new Date(),
//         },
//       },
//     });
//   } catch (err) {
//     console.error('Login recording failed:', err.message);
//   }
// };


const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const LessonProgress = require('../models/LessonProgress');
const Course = require('../models/Course');

exports.getLearningHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1. Get all lesson progresses for this user
    const progresses = await LessonProgress.find({ userId }).lean();
    if (!progresses.length) return res.json([]);

    // 2. Get lesson + course details
    const lessonIds = progresses.map((p) => p.lessonId);
    const lessons = await Lesson.find({ _id: { $in: lessonIds } })
      .populate("courseId", "title type startDate endDate")
      .lean();

    // 3. Get all quizzes linked to those lessons
    const quizzes = await Quiz.find({ lessonId: { $in: lessonIds } }).lean();

    const history = [];

    for (const progress of progresses) {
      const lesson = lessons.find(
        (l) => l._id.toString() === progress.lessonId.toString()
      );

      const record = {
        courseTitle: lesson?.courseId?.title || "N/A",
        lessonTitle: lesson?.title || "N/A",
        lessonStartDate: lesson?.startDate || null,
        lessonEndDate: lesson?.endDate || null,
        lessonStatus: progress.status,
        quizScore: null,
        quizStatus: null,
        quizDate: null,
      };

      // 4. Check if quiz exists for this lesson
      const quiz = quizzes.find(
        (q) => q.lessonId.toString() === progress.lessonId.toString()
      );

      if (quiz && quiz.attempts?.length) {
        const lastAttempt = quiz.attempts
          .filter((a) => a.userId.toString() === userId.toString())
          .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))[0];

        if (lastAttempt) {
          record.quizScore = lastAttempt.score;
          record.quizStatus = lastAttempt.status;
          record.quizDate = lastAttempt.attemptedAt;
        }
      }

      history.push(record);
    }

    res.json(history);
  } catch (err) {
    console.error("getLearningHistory error", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};
