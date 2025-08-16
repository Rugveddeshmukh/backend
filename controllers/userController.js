const User = require('../models/User');
const Quiz = require('../models/Quiz'); // Required for aggregation

// ✅ User dashboard metrics
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('coursesEnrolled') 
      .populate({
        path: 'certificates',
        populate: { path: 'courseId', model: 'Course' }
      });

    const completedCourses = user.certificates?.length || 0;
    const inProgressCourses = (user.coursesEnrolled?.length || 0) - completedCourses;

    const quizAttempts = await Quiz.aggregate([
      { $unwind: '$attempts' },
      { $match: { 'attempts.userId': user._id } },
      {
        $group: {
          _id: '$attempts.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingAction = user.coursesEnrolled?.length
      ? `Continue Course: ${user.coursesEnrolled[0].title}`
      : 'No active course yet';

    res.json({
      fullName: user.fullName,
      certificatesEarned: completedCourses,
      courses: {
        completed: completedCourses,
        inProgress: inProgressCourses,
      },
      quizStats: quizAttempts,
      nextPendingAction: pendingAction,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};

// ✅ Update profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed' });
  }
};

// ✅ View login history
exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.loginHistory || []);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch login history' });
  }
};

// ✅ Record login history (called manually or during login)
exports.recordLogin = async (userId, ip, device) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        loginHistory: {
          ip,
          device,
          timestamp: new Date(),
        },
      },
    });
  } catch (err) {
    console.error('Login recording failed:', err.message);
  }
};
