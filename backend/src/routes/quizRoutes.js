const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Generate PIN for new quiz
router.post('/generate-pin', quizController.generatePin);

// Validate PIN
router.post('/validate-pin', quizController.validatePin);

// Start a new quiz
router.post('/start', quizController.startQuiz);

// Submit quiz answers
router.post('/submit/:hasilId', quizController.submitQuiz);

// Submit quiz result directly (new endpoint)
router.post('/submit-result', quizController.submitQuizResult);

// Get quiz results
router.get('/results/:hasilId', quizController.getQuizResults);

module.exports = router;