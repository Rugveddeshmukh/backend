
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number, required: true } // index 0..3
});

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number, // percentage 0..100
  status: { type: String, enum: ['pass', 'fail'] },
  attemptedAt: { type: Date, default: Date.now },
  timeTaken: Number, // in seconds
  timeExpired: { type: Boolean, default: false }
});

const quizSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [questionSchema],
  passPercentage: { type: Number, default: 60 },
  duration: { type: Number, default: 0 }, 
  attempts: [attemptSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
