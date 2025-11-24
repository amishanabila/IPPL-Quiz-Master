const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Get leaderboard with optional filters (kategori_id, materi_id)
router.get('/', leaderboardController.getLeaderboard);

// Get kategori list with stats
router.get('/kategori', leaderboardController.getKategoriWithStats);

// Get materi list by kategori with stats (kategori_id as query param)
router.get('/materi', leaderboardController.getMateriByKategori);

// Reset leaderboard
router.delete('/reset', leaderboardController.resetLeaderboard);

module.exports = router;
