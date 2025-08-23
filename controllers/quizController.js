const Quiz = require('../models/Quiz');
const csv = require('csvtojson');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const normalize = (val) => (val ? val.toString().trim() : '');
const lower = (val) => (val ? val.toString().trim().toLowerCase() : '');

const parseCorrectIndex = (raw, rowNum) => {
  // Accept 1..4 OR A/B/C/D
  if (raw === undefined || raw === null || raw === '') {
    throw new Error(`Missing correct answer at row ${rowNum}`);
  }
  const str = raw.toString().trim();
  if (/^[1-4]$/.test(str)) return parseInt(str, 10) - 1;
  const map = { a: 0, b: 1, c: 2, d: 3 };
  const idx = map[str.toLowerCase()];
  if (idx === undefined) {
    throw new Error(`Invalid correct answer at row ${rowNum}. Use 1-4 or A-D.`);
  }
  return idx;
};

exports.uploadQuizFromCSV = async (req, res) => {
  try {
    // multer memoryStorage provides: req.file.originalname, req.file.buffer
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (ext !== 'csv') {
      return res.status(400).json({ message: 'Only CSV files are allowed' });
    }

    const { courseName, passPercentage, durationMinutes, courseId } = req.body;
    if (!courseName || passPercentage === undefined) {
      return res.status(400).json({ message: 'courseName and passPercentage are required' });
    }

    // 1) Parse CSV directly from memory buffer
    const csvStr = req.file.buffer.toString('utf-8');
    const jsonArray = await csv().fromString(csvStr);
    if (!jsonArray || jsonArray.length === 0) {
      return res.status(400).json({ message: 'CSV is empty' });
    }

    // 2) Build questions (case-insensitive keys)
    const questions = jsonArray.map((row, i) => {
      const rowNum = i + 2; // + header row
      // Build a lower-keyed map for flexible headers
      const L = {};
      Object.keys(row).forEach(k => (L[lower(k)] = row[k]));

      // Accept multiple header variants
      const qText = L['question'] || L['ques'] || L['q'];
      const o1 = L['optiona'] || L['option1'] || L['a'] || L['option a'];
      const o2 = L['optionb'] || L['option2'] || L['b'] || L['option b'];
      const o3 = L['optionc'] || L['option3'] || L['c'] || L['option c'];
      const o4 = L['optiond'] || L['option4'] || L['d'] || L['option d'];
      const correctRaw = L['correctanswerindex'] || L['correct'] || L['answerindex'] || L['correct answer index'] || L['correctoption'];

      if (!qText || !o1 || !o2 || !o3 || !o4) {
        throw new Error(`Missing fields at row ${rowNum}. Need: question, optionA..optionD, correct`);
      }
      const correctIndex = parseCorrectIndex(correctRaw, rowNum);

      return {
        question: normalize(qText),
        options: [normalize(o1), normalize(o2), normalize(o3), normalize(o4)],
        correctAnswer: correctIndex
      };
    });

    // 3) Upload raw CSV to Cloudinary (resource_type: 'raw')
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'quizzes/csv' },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file.buffer);
      });

    const uploadResult = await uploadToCloudinary();

    // 4) Save Quiz
    const quiz = await Quiz.create({
      courseName: normalize(courseName),
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined,
      passPercentage: Number(passPercentage),
      duration: durationMinutes ? Math.round(Number(durationMinutes) * 60) : 0,
      questions,
      csvUrl: uploadResult.secure_url
    });

    return res.status(201).json({ message: 'Quiz created from CSV', quiz });
  } catch (err) {
    console.error('uploadQuizFromCSV error', err);
    return res.status(500).json({ message: 'Failed to upload CSV', error: err.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('-questions.correctAnswer -attempts');
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quizzes' });
  }
};

exports.getQuizForAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;
    if (!quizId) return res.status(400).json({ message: 'Quiz ID is required' });

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

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
    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'quizId and answers are required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (ans !== undefined && ans !== null && Number(ans) === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = quiz.questions.length ? (correctCount / quiz.questions.length) * 100 : 0;

    let timeTakenSec = null;
    let timeExpired = false;
    if (startedAt) {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      if (!Number.isNaN(start)) {
        timeTakenSec = Math.round((now - start) / 1000);
        if (quiz.duration && timeTakenSec > quiz.duration) timeExpired = true;
      }
    }

    let status = percentage >= quiz.passPercentage ? 'pass' : 'fail';
    if (timeExpired) status = 'fail';

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
      message: timeExpired ? 'Time expired — attempt recorded as fail' : 'Quiz submitted',
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
