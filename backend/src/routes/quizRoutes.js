const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Start a new quiz
router.post('/start', quizController.startQuiz);

// Submit quiz answers
router.post('/submit/:hasilId', quizController.submitQuiz);

// Get quiz results
router.get('/results/:hasilId', quizController.getQuizResults);

module.exports = router;