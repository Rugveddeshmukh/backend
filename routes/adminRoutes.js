
const express = require("express");
const router = express.Router();
const { getTotalUsers, getAllUsers,blockUser,unblockUser,deleteUser, } = require("../controllers/adminController");

router.get("/total-users", getTotalUsers);
router.get("/all-users", getAllUsers); 
router.delete('/users/:id', deleteUser);

module.exports = router;
