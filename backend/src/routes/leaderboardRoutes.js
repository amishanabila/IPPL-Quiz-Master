const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Get leaderboard
router.get('/', leaderboardController.getLeaderboard);

// Reset leaderboard
router.delete('/reset', leaderboardController.resetLeaderboard);

module.exports = router;
