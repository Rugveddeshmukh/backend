const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const helpController = require("../controllers/helpController");

// FAQs
router.get("/faqs", helpController.getFAQs);
router.post("/faqs", protect, adminOnly, helpController.addFAQ);
router.delete("/faqs/:id", protect, adminOnly, helpController.deleteFAQ);

// User Manuals
router.get("/manuals", helpController.getManuals);
router.post("/manuals", protect, adminOnly, helpController.addManual);
router.delete("/manuals/:id", protect, adminOnly, helpController.deleteManual);

module.exports = router;
