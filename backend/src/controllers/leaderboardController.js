const db = require('../config/db');

// Get leaderboard data with optional kategori and materi filters
exports.getLeaderboard = async (req, res) => {
  try {
    const { kategori_id, materi_id, kumpulan_soal_id } = req.query;
    
    console.log('📊 getLeaderboard called with filters:', { kategori_id, materi_id, kumpulan_soal_id });

    let results;

    // Gunakan stored procedure sesuai filter
    if (kategori_id) {
      // Filter by kategori
      const [data] = await db.query(
        'CALL sp_peserta_get_leaderboard_by_kategori(?, 100)',
        [kategori_id]
      );
      results = data[0];
    } else if (kumpulan_soal_id) {
      // Filter by kumpulan_soal
      const [data] = await db.query(
        'CALL sp_peserta_get_leaderboard(?, 100)',
        [kumpulan_soal_id]
      );
      results = data[0];
    } else {
      // Get all leaderboard
      const [data] = await db.query(
        'CALL sp_peserta_get_leaderboard(NULL, 100)'
      );
      results = data[0];
    }

    // Filter by materi jika diperlukan (post-filter karena tidak ada SP khusus)
    if (materi_id && results) {
      results = results.filter(r => r.materi_id == materi_id);
    }

    console.log('✅ Found', results.length, 'leaderboard entries');

    res.json({
      status: 'success',
      data: results,
      filters: {
        kategori_id: kategori_id || null,
        materi_id: materi_id || null,
        kumpulan_soal_id: kumpulan_soal_id || null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil data leaderboard'
    });
  }
};

// Get kategori list with quiz count
exports.getKategoriWithStats = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        k.id as kategori_id,
        k.nama_kategori,
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal,
        COUNT(DISTINCT ha.hasil_id) as total_hasil
      FROM kategori k
      LEFT JOIN kumpulan_soal ks ON k.id = ks.kategori_id
      LEFT JOIN hasil_quiz ha ON ks.kumpulan_soal_id = ha.kumpulan_soal_id
      GROUP BY k.id, k.nama_kategori
      HAVING total_kumpulan_soal > 0
      ORDER BY k.nama_kategori ASC
    `);

    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error fetching kategori stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil data kategori'
    });
  }
};

// Get materi list by kategori with quiz count
exports.getMateriByKategori = async (req, res) => {
  try {
    const { kategori_id } = req.query;
    
    let query = `
      SELECT 
        m.materi_id,
        m.judul,
        k.nama_kategori,
        k.id as kategori_id,
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal,
        COUNT(DISTINCT ha.hasil_id) as total_hasil
      FROM materi m
      JOIN kategori k ON m.kategori_id = k.id
      LEFT JOIN kumpulan_soal ks ON m.materi_id = ks.materi_id
      LEFT JOIN hasil_quiz ha ON ks.kumpulan_soal_id = ha.kumpulan_soal_id
    `;

    const params = [];

    if (kategori_id) {
      query += ` WHERE k.id = ?`;
      params.push(kategori_id);
    }

    query += `
      GROUP BY m.materi_id, m.judul, k.nama_kategori, k.id
      HAVING total_kumpulan_soal > 0
      ORDER BY m.judul ASC
    `;

    const [results] = await db.query(query, params);

    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error fetching materi by kategori:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil data materi'
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
