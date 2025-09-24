// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  sendNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getAllNotifications
} = require("../controllers/notificationController");


router.post("/send", protect, adminOnly, sendNotification);

router.get("/", protect, getUserNotifications);

router.put("/:id/read", protect, markAsRead);

router.delete("/:id", protect, adminOnly, deleteNotification);


router.get("/all", protect, adminOnly, getAllNotifications);


module.exports = router;
