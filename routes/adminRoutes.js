
const express = require("express");
const router = express.Router();
const { getAllUsers,deleteUser,approveUser,toggleUserStatus,getUserStats,getLessonStats } = require("../controllers/adminController");
const {protect,adminOnly} = require('../middleware/authMiddleware');


router.get("/users", protect, adminOnly, getUserStats);
router.get("/all-users", getAllUsers); 
router.delete('/users/:id', deleteUser);
router.put('/users/:id/approve', protect, adminOnly, approveUser);
router.put("/users/:id/toggle-status", protect, adminOnly, toggleUserStatus);
router.get("/lessons/stats", protect, adminOnly, getLessonStats);





module.exports = router;
