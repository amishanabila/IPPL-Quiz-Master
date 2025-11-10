const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const soalController = require('../controllers/soalController');

// Create kumpulan soal (protected)
router.post('/kumpulan', auth, soalController.createKumpulanSoal);

// Get kumpulan soal by id
router.get('/kumpulan/:id', soalController.getKumpulanSoal);

// Update kumpulan soal (protected)
router.put('/kumpulan/:id', auth, soalController.updateKumpulanSoal);

// Delete kumpulan soal (protected)
router.delete('/kumpulan/:id', auth, soalController.deleteKumpulanSoal);

// Get soal by kategori
router.get('/kategori/:kategoriId', soalController.getSoalByKategori);

module.exports = router;