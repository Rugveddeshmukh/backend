const User = require('../models/User');

// GET /api/admin/total-users
exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (err) {
    console.error('Error getting total users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "fullName email dateOfBirth role loginHistory"); // select specific fields
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