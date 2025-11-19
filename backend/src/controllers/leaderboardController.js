const db = require('../config/db');

// Get leaderboard data
exports.getLeaderboard = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        ha.nama_peserta,
        m.judul as materi,
        k.nama_kategori as kategori,
        ha.skor,
        ha.jawaban_benar,
        ha.waktu_pengerjaan,
        ha.created_at
      FROM hasil_quiz ha
      LEFT JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
      LEFT JOIN materi m ON ks.materi_id = m.materi_id
      LEFT JOIN kategori k ON ks.kategori_id = k.id
      WHERE ha.skor IS NOT NULL
      ORDER BY ha.skor DESC, ha.waktu_pengerjaan ASC
      LIMIT 100
    `);

    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil data leaderboard'
    });
  }
};

// Reset leaderboard (delete all data from hasil_quiz)
exports.resetLeaderboard = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM hasil_quiz');

    res.json({
      status: 'success',
      message: 'Leaderboard berhasil direset',
      data: {
        deletedRows: result.affectedRows
      }
    });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mereset leaderboard'
    });
  }
};
