const db = require('../config/db');

// Helper function to generate 6 digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to check if PIN exists
async function isPinExists(pin) {
  const [result] = await db.query('SELECT quiz_id FROM quiz WHERE pin_code = ?', [pin]);
  return result.length > 0;
}

const quizController = {
  // Generate PIN for new quiz
  async generatePin(req, res) {
    try {
      const { judul, deskripsi, kumpulan_soal_id, user_id, durasi, tanggal_mulai, tanggal_selesai } = req.body;

      // Validasi input
      if (!judul || !kumpulan_soal_id || !user_id || !durasi || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({
          status: 'error',
          message: 'Semua field wajib diisi (judul, kumpulan_soal_id, user_id, durasi, tanggal_mulai, tanggal_selesai)'
        });
      }

      // Generate unique PIN
      let pin;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        pin = generatePin();
        attempts++;
        if (attempts > maxAttempts) {
          return res.status(500).json({
            status: 'error',
            message: 'Gagal membuat PIN unik, silakan coba lagi'
          });
        }
      } while (await isPinExists(pin));

      // Create quiz with PIN
      const [result] = await db.query(
        `INSERT INTO quiz 
         (judul, deskripsi, kumpulan_soal_id, created_by, pin_code, durasi, tanggal_mulai, tanggal_selesai, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [judul, deskripsi, kumpulan_soal_id, user_id, pin, durasi, tanggal_mulai, tanggal_selesai]
      );

      res.json({
        status: 'success',
        data: {
          quiz_id: result.insertId,
          pin_code: pin,
          judul,
          message: 'Quiz berhasil dibuat dengan PIN'
        }
      });
    } catch (error) {
      console.error('Error generating PIN:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat quiz'
      });
    }
  },

  // Validate PIN and get quiz info
  async validatePin(req, res) {
    try {
      const { pin } = req.body;

      // Validasi format PIN
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({
          status: 'error',
          message: 'PIN harus 6 digit angka'
        });
      }

      // Cari quiz berdasarkan PIN
      const [quiz] = await db.query(
        `SELECT q.*, ks.judul as kumpulan_soal_judul, k.nama_kategori as kategori_nama,
                ks.jumlah_soal
         FROM quiz q
         JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.kumpulan_soal_id
         JOIN kategori k ON ks.kategori_id = k.id
         WHERE q.pin_code = ? AND q.status = 'active'`,
        [pin]
      );

      if (quiz.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'PIN tidak valid atau quiz sudah tidak aktif'
        });
      }

      // Check if quiz is still within time range
      const now = new Date();
      const startTime = new Date(quiz[0].tanggal_mulai);
      const endTime = new Date(quiz[0].tanggal_selesai);

      if (now < startTime) {
        return res.status(400).json({
          status: 'error',
          message: 'Quiz belum dimulai'
        });
      }

      if (now > endTime) {
        return res.status(400).json({
          status: 'error',
          message: 'Quiz sudah berakhir'
        });
      }

      res.json({
        status: 'success',
        data: {
          quiz_id: quiz[0].quiz_id,
          judul: quiz[0].judul,
          deskripsi: quiz[0].deskripsi,
          kategori: quiz[0].kategori_nama,
          jumlah_soal: quiz[0].jumlah_soal,
          durasi: quiz[0].durasi,
          kumpulan_soal_id: quiz[0].kumpulan_soal_id
        }
      });
    } catch (error) {
      console.error('Error validating PIN:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memvalidasi PIN'
      });
    }
  },

  // Start a new quiz (untuk peserta)
  async startQuiz(req, res) {
    try {
      const { kumpulan_soal_id, nama_peserta, pin_code } = req.body;

      // Validasi input
      if (!kumpulan_soal_id || !nama_peserta) {
        return res.status(400).json({
          status: 'error',
          message: 'Kumpulan soal ID dan nama peserta wajib diisi'
        });
      }

      // Get soal dari kumpulan_soal
      const [soal] = await db.query(
        `SELECT soal_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d 
         FROM soal 
         WHERE kumpulan_soal_id = ?
         ORDER BY RAND()`,
        [kumpulan_soal_id]
      );

      if (soal.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Tidak ada soal tersedia untuk kumpulan soal ini'
        });
      }

      // Create quiz hasil entry (belum ada skor)
      const [result] = await db.query(
        'INSERT INTO hasil_quiz (nama_peserta, kumpulan_soal_id, total_soal, pin_code) VALUES (?, ?, ?, ?)',
        [nama_peserta, kumpulan_soal_id, soal.length, pin_code]
      );

      res.json({
        status: 'success',
        data: {
          hasil_id: result.insertId,
          soal: soal
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
      const { jawaban, waktu_selesai } = req.body;

      // Get correct answers
      const answeredSoalIds = Object.keys(jawaban);
      const [soal] = await db.query(
        'SELECT soal_id, jawaban_benar FROM soal WHERE soal_id IN (?)',
        [answeredSoalIds]
      );

      // Calculate score
      let totalBenar = 0;
      soal.forEach(s => {
        if (jawaban[s.soal_id] === s.jawaban_benar) {
          totalBenar++;
        }
      });

      const skor = Math.round((totalBenar / soal.length) * 100);

      // Update hasil_quiz dengan data lengkap
      await db.query(
        'UPDATE hasil_quiz SET skor = ?, jawaban_benar = ?, waktu_selesai = ?, completed_at = NOW() WHERE hasil_id = ?',
        [skor, totalBenar, waktu_selesai, hasilId]
      );

      res.json({
        status: 'success',
        data: {
          skor,
          jawaban_benar: totalBenar,
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

  // Submit quiz result directly (simplified endpoint)
  async submitQuizResult(req, res) {
    const connection = await db.getConnection();
    
    try {
      const { nama_peserta, kumpulan_soal_id, skor, jawaban_benar, total_soal, waktu_pengerjaan, pin_code, jawaban_detail } = req.body;

      // Validasi input
      if (!nama_peserta || !kumpulan_soal_id || skor === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'Data tidak lengkap'
        });
      }

      // Start transaction
      await connection.beginTransaction();

      try {
        // Insert hasil quiz
        const [result] = await connection.query(
          `INSERT INTO hasil_quiz 
           (nama_peserta, kumpulan_soal_id, skor, jawaban_benar, total_soal, waktu_pengerjaan, pin_code, completed_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [nama_peserta, kumpulan_soal_id, skor, jawaban_benar, total_soal, waktu_pengerjaan, pin_code]
        );

        const hasil_id = result.insertId;

        console.log('✅ Quiz result saved to database:', {
          hasil_id,
          nama_peserta,
          skor,
          jawaban_benar,
          total_soal
        });

        // Insert user_answers if provided
        if (jawaban_detail && Array.isArray(jawaban_detail) && jawaban_detail.length > 0) {
          for (const jawab of jawaban_detail) {
            await connection.query(
              `INSERT INTO user_answers (hasil_id, soal_id, jawaban, is_correct) 
               VALUES (?, ?, ?, ?)`,
              [hasil_id, jawab.soal_id, jawab.jawaban, jawab.is_correct]
            );
          }
          console.log('✅ User answers saved:', jawaban_detail.length, 'answers');
        }

        // Commit transaction
        await connection.commit();

        res.json({
          status: 'success',
          message: 'Hasil quiz berhasil disimpan',
          data: {
            hasil_id,
            skor,
            jawaban_benar,
            total_soal
          }
        });
      } catch (error) {
        // Rollback on error
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error submitting quiz result:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menyimpan hasil quiz'
      });
    } finally {
      connection.release();
    }
  },

  // Get quiz results
  async getQuizResults(req, res) {
    try {
      const { hasilId } = req.params;

      const [hasil] = await db.query(
        `SELECT hq.*, k.nama_kategori, m.judul as materi_judul
         FROM hasil_quiz hq 
         LEFT JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
         LEFT JOIN kategori k ON ks.kategori_id = k.id 
         LEFT JOIN materi m ON ks.materi_id = m.materi_id
         WHERE hq.hasil_id = ?`,
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