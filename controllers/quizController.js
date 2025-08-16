
const Quiz = require('../models/Quiz');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const normalize = (val) => (val ? val.toString().trim().toLowerCase() : '');


exports.uploadQuizFromCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // ensure .csv
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.csv') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Only CSV files are allowed' });
    }

    const { courseName, passPercentage, durationMinutes, courseId } = req.body;
    if (!courseName || !passPercentage) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'courseName and passPercentage are required' });
    }

    const jsonArray = await csv().fromFile(req.file.path);

    if (!jsonArray || jsonArray.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'CSV is empty' });
    }

    
    const headers = Object.keys(jsonArray[0]).map(normalize);
    const required = ['question'];
   
    const questions = jsonArray.map((row, idx) => {
      
      const raw = {};
      for (const k of Object.keys(row)) raw[normalize(k)] = row[k];

      const qText = raw.question || raw['ques'] || raw['q'];
      const o1 = raw.optiona || raw.option1 || raw.a || raw['option a'];
      const o2 = raw.optionb || raw.option2 || raw.b || raw['option b'];
      const o3 = raw.optionc || raw.option3 || raw.c || raw['option c'];
      const o4 = raw.optiond || raw.option4 || raw.d || raw['option d'];
      const correctRaw = raw.correctanswerindex || raw.correct || raw.answerindex || raw['correct answer index'];

      if (!qText || !o1 || !o2 || !o3 || !o4) {
        throw new Error(`Missing fields in CSV at row ${idx + 2}. Each row must have question, four options.`); 
      }

      const correctIndex = parseInt(correctRaw, 10);
      if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        throw new Error(`Invalid correct answer index at row ${idx + 2}. Must be 0..3.`);
      }

      return {
        question: qText.toString().trim(),
        options: [o1.toString().trim(), o2.toString().trim(), o3.toString().trim(), o4.toString().trim()],
        correctAnswer: correctIndex
      };
    });

    const quiz = await Quiz.create({
      courseName,
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : null,
      passPercentage: Number(passPercentage),
      duration: durationMinutes ? Math.round(Number(durationMinutes) * 60) : 0, // minutes -> seconds
      questions
    });

    fs.unlinkSync(req.file.path);
    return res.status(201).json({ message: 'Quiz created from CSV', quiz });
  } catch (err) {
    console.error('uploadQuizFromCSV error', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ message: 'Failed to upload CSV', error: err.message });
  }
};


exports.getQuizByCourse = async (req, res) => {
  try {
    const idOrName = req.params.courseId;
    const query = {};
    if (mongoose.Types.ObjectId.isValid(idOrName)) query.courseId = idOrName;
    else query.courseName = idOrName;
    const quizzes = await Quiz.find(query);
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quizzes' });
  }
};


exports.getQuizForAttempt = async (req, res) => {
  try {
    const quizId = req.params.id; // correct param name
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Remove correct answers before sending to user
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options
    }));

    return res.json({
      _id: quiz._id,
      courseName: quiz.courseName,
      passPercentage: quiz.passPercentage,
      duration: quiz.duration,
      questions: safeQuestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quiz for attempt' });
  }
};

exports.updateQuizSettings = async (req, res) => {
  try {
    const { passPercentage, durationMinutes } = req.body;
    const update = {};
    if (passPercentage !== undefined) update.passPercentage = Number(passPercentage);
    if (durationMinutes !== undefined) update.duration = Math.round(Number(durationMinutes) * 60);

    const quiz = await Quiz.findByIdAndUpdate(req.params.quizId, update, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz settings updated', quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update quiz settings' });
  }
};


exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, startedAt } = req.body;
    if (!quizId || !Array.isArray(answers)) return res.status(400).json({ message: 'quizId and answers are required' });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Score calculation
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && q.correctAnswer === answers[idx]) correctCount++;
    });

    const percentage = quiz.questions.length > 0 ? (correctCount / quiz.questions.length) * 100 : 0;

    // Time checks
    let timeTakenSec = null;
    let timeExpired = false;
    if (startedAt) {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      if (Number.isNaN(start)) {
        
      } else {
        timeTakenSec = Math.round((now - start) / 1000);
        if (quiz.duration && timeTakenSec > quiz.duration) {
          timeExpired = true;
        }
      }
    }

    // Decide status      
    let status = percentage >= quiz.passPercentage ? 'pass' : 'fail';
    if (timeExpired) {
      // mark as fail when time expired (policy choice). You could also return 400 to client.
      status = 'fail';
    }

    // Save attempt
    quiz.attempts.push({
      userId: req.user && (req.user.id || req.user._id),
      score: Math.round(percentage * 100) / 100,
      status,
      attemptedAt: new Date(),
      timeTaken: timeTakenSec,
      timeExpired
    });

    await quiz.save();

    return res.json({
      message: timeExpired ? 'Time expired — your attempt is recorded as fail' : 'Quiz submitted',
      score: Math.round(percentage * 100) / 100,
      status,
      timeTaken: timeTakenSec,
      timeExpired
    });
  } catch (err) {
    console.error('submitQuiz error', err);
    res.status(500).json({ message: 'Quiz submission failed', error: err.message });
  }
};
