const Certificate = require('../models/Certificate');

exports.issueCertificate = async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;
    const cert = await Certificate.create({ userId, courseId, certificateUrl, issuedDate: new Date() });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: 'Failed to issue certificate' });
  }
};

exports.getCertificatesByUser = async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id }).populate('courseId');
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load certificates' });
  }
};