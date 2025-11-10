const db = require('../config/db');

const quizController = {
  // Start a new quiz
  async startQuiz(req, res) {
    try {
      const { kategori_id, user_id } = req.body;

      // Get random soal for the quiz
      const [soal] = await db.query(
        `SELECT s.* 
         FROM soal s 
         JOIN kumpulan_soal ks ON s.kumpulan_id = ks.id 
         WHERE ks.kategori_id = ?
         ORDER BY RAND()
         LIMIT 10`,
        [kategori_id]
      );

      if (soal.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Tidak ada soal tersedia untuk kategori ini'
        });
      }

      // Create quiz hasil entry
      const [result] = await db.query(
        'INSERT INTO hasil_quiz (user_id, kategori_id) VALUES (?, ?)',
        [user_id, kategori_id]
      );

      // Remove jawaban_benar from soal before sending to client
      const soalWithoutAnswers = soal.map(({ jawaban_benar, ...item }) => item);

      res.json({
        status: 'success',
        data: {
          hasil_id: result.insertId,
          soal: soalWithoutAnswers
        }
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memulai quiz'
      });
    }
  },

  // Submit quiz answers
  async submitQuiz(req, res) {
    try {
      const { hasilId } = req.params;
      const { jawaban } = req.body;

      // Get correct answers
      const answeredSoalIds = Object.keys(jawaban);
      const [soal] = await db.query(
        'SELECT id, jawaban_benar FROM soal WHERE id IN (?)',
        [answeredSoalIds]
      );

      // Calculate score
      let totalBenar = 0;
      soal.forEach(s => {
        if (jawaban[s.id] === s.jawaban_benar) {
          totalBenar++;
        }
      });

      const score = (totalBenar / soal.length) * 100;

      // Update hasil_quiz
      await db.query(
        'UPDATE hasil_quiz SET score = ?, completed_at = NOW() WHERE id = ?',
        [score, hasilId]
      );

      res.json({
        status: 'success',
        data: {
          score,
          total_benar: totalBenar,
          total_soal: soal.length
        }
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengirim jawaban quiz'
      });
    }
  },

  // Get quiz results
  async getQuizResults(req, res) {
    try {
      const { hasilId } = req.params;

      const [hasil] = await db.query(
        `SELECT hq.*, k.nama as kategori_nama, u.nama as user_nama 
         FROM hasil_quiz hq 
         JOIN kategori k ON hq.kategori_id = k.id 
         JOIN users u ON hq.user_id = u.id 
         WHERE hq.id = ?`,
        [hasilId]
      );

      if (hasil.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Hasil quiz tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        data: hasil[0]
      });
    } catch (error) {
      console.error('Error getting quiz results:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil hasil quiz'
      });
    }
  }
};

module.exports = quizController;