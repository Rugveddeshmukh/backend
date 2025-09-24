const FAQ = require("../models/FAQ");
const UserManual = require("../models/UserManual");

// Get all FAQs
exports.getFAQs = async (req, res) => {
  const faqs = await FAQ.find();
  res.json(faqs);
};

// Add FAQ
exports.addFAQ = async (req, res) => {
  const { question, answer } = req.body;
  const faq = new FAQ({ question, answer });
  await faq.save();
  res.json(faq);
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ message: "FAQ deleted" });
};

// Get Manuals
exports.getManuals = async (req, res) => {
  const manuals = await UserManual.find();
  res.json(manuals);
};

// Add Manual (Text)
exports.addManual = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and Content are required" });
    }

    const manual = new UserManual({ title, content });
    await manual.save();

    res.json(manual);
  } catch (err) {
    console.error("Add Manual Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Manual
exports.deleteManual = async (req, res) => {
  try {
    await UserManual.findByIdAndDelete(req.params.id);
    res.json({ message: "Manual deleted" });
  } catch (err) {
    console.error("Delete Manual Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
