const Notification = require("../models/Notification");
const User = require("../models/User"); 

// ✅ Admin send notification
exports.sendNotification = async (req, res) => {
  try {
    const { targetType, targetValue, title, message, type } = req.body;

    let notifications = [];

    if (targetType === "all") {
      // All users + global notification
      notifications.push(
        new Notification({ userId: null, title, message, type })
      );
    } else {
      // Build query based on targetType
      const query = {};
      if (targetType === "user") query._id = targetValue;
      if (targetType === "teamLeader") query.teamLeader = targetValue;
      if (targetType === "designation") query.designation = targetValue;

      const users = await User.find(query).select("_id");

      notifications = users.map(
        (u) =>
          new Notification({
            userId: u._id,
            title,
            message,
            type,
          })
      );
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, count: notifications.length });
  } catch (err) {
    console.error("Send Notification Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ User fetch notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({
      $or: [{ userId }, { userId: null }],
    }).populate("userId", "fullName teamLeader designation employeeId").sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("userId", "fullName teamLeader designation employeeId")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Delete Notification Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
