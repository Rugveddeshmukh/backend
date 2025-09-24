const User = require('../models/User');
const LessonProgress = require("../models/LessonProgress");
const Quiz = require("../models/Quiz");
const Lesson = require('../models/Lesson');

// GET /api/admin/total-users
exports.getUserStats = async (req, res) => {
  try {
    // 1. All users
    const allUsers = await User.find({}).select("_id");

    // 2. Users who completed at least one lesson
    const lessonUsers = await LessonProgress.distinct("userId", {
      status: "completed",
    });

    // 3. Users who attempted at least one quiz
    const quizUsers = await Quiz.distinct("userId");

    // 4. Merge both into active users set
    const activeSet = new Set([
      ...lessonUsers.map((id) => id.toString()),
      ...quizUsers.map((id) => id.toString()),
    ]);

    // 5. Count
    const activeUsers = activeSet.size;
    const inactiveUsers = allUsers.filter(
      (u) => !activeSet.has(u._id.toString())
    ).length;

    res.json({
      totalUsers: allUsers.length,
      activeUsers,
      inactiveUsers,
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    res.status(500).json({ message: "Failed to fetch user stats" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const users = await User.find(
      filter,
      "employeeId fullName email contactNo teamLeader designation role loginHistory isApproved createdAt approvedAt"
    ).sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};


// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isApproved = true;
    user.approvedAt = new Date();
    await user.save();

    res.status(200).json({ message: "User approved successfully", user });
  } catch (err) {
    console.error("Approve Error:", err);
    res.status(500).json({ message: "Error approving user" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked; // toggle status
    await user.save();

    res.status(200).json({
      message: `User ${user.isBlocked ? "blocked (inactive)" : "unblocked (active)"} successfully`,
      user
    });
  } catch (err) {
    console.error("Toggle User Status Error:", err);
    res.status(500).json({ message: "Error updating user status" });
  }
};

exports.getLessonStats = async (req, res) => {
  try {
    const totalLessons = await Lesson.countDocuments();
    const lessonUserIds = await LessonProgress.distinct("userId");
    const lessonAccessUsers = lessonUserIds.length;

    res.json({
      totalLessons,
      lessonAccessUsers
    });
  } catch (err) {
    console.error("getLessonStats error:", err);
    res.status(500).json({ message: "Failed to fetch lesson stats" });
  }
};




