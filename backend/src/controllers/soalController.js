const db = require('../config/db');

const soalController = {
  // Create kumpulan soal
  async createKumpulanSoal(req, res) {
    try {
      const { kategori_id, soal_list } = req.body;
      const created_by = req.user.id; // From auth middleware

      // Start transaction
      await db.beginTransaction();

      try {
        // Create kumpulan_soal entry
        const [kumpulanResult] = await db.query(
          'INSERT INTO kumpulan_soal (kategori_id, created_by) VALUES (?, ?)',
          [kategori_id, created_by]
        );

        const kumpulan_id = kumpulanResult.insertId;

        // Insert individual soal
        for (const soal of soal_list) {
          await db.query(
            'INSERT INTO soal (kumpulan_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [kumpulan_id, soal.pertanyaan, soal.pilihan_a, soal.pilihan_b, soal.pilihan_c, soal.pilihan_d, soal.jawaban_benar]
          );
        }

        // Commit transaction
        await db.commit();

        res.status(201).json({
          status: 'success',
          message: 'Kumpulan soal berhasil dibuat',
          data: {
            id: kumpulan_id,
            kategori_id,
            soal_count: soal_list.length
          }
        });
      } catch (error) {
        // Rollback in case of error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error creating kumpulan soal:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat kumpulan soal'
      });
    }
  },

  // Get kumpulan soal by id
  async getKumpulanSoal(req, res) {
    try {
      const { id } = req.params;

      // Get kumpulan_soal info
      const [kumpulan] = await db.query(
        'SELECT ks.*, k.nama as kategori_nama FROM kumpulan_soal ks JOIN kategori k ON ks.kategori_id = k.id WHERE ks.id = ?',
        [id]
      );

      if (kumpulan.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Kumpulan soal tidak ditemukan'
        });
      }

      // Get soal list
      const [soal] = await db.query(
        'SELECT id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar FROM soal WHERE kumpulan_id = ?',
        [id]
      );

      res.json({
        status: 'success',
        data: {
          ...kumpulan[0],
          soal_list: soal
        }
      });
    } catch (error) {
      console.error('Error getting kumpulan soal:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data kumpulan soal'
      });
    }
  },

  // Update kumpulan soal
  async updateKumpulanSoal(req, res) {
    try {
      const { id } = req.params;
      const { kategori_id, soal_list } = req.body;
      const updated_by = req.user.id; // From auth middleware

      // Start transaction
      await db.beginTransaction();

      try {
        // Update kumpulan_soal
        const [kumpulanResult] = await db.query(
          'UPDATE kumpulan_soal SET kategori_id = ?, updated_by = ? WHERE id = ?',
          [kategori_id, updated_by, id]
        );

        if (kumpulanResult.affectedRows === 0) {
          await db.rollback();
          return res.status(404).json({
            status: 'error',
            message: 'Kumpulan soal tidak ditemukan'
          });
        }

        // Delete existing soal
        await db.query('DELETE FROM soal WHERE kumpulan_id = ?', [id]);

        // Insert updated soal
        for (const soal of soal_list) {
          await db.query(
            'INSERT INTO soal (kumpulan_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, soal.pertanyaan, soal.pilihan_a, soal.pilihan_b, soal.pilihan_c, soal.pilihan_d, soal.jawaban_benar]
          );
        }

        // Commit transaction
        await db.commit();

        res.json({
          status: 'success',
          message: 'Kumpulan soal berhasil diperbarui',
          data: {
            id,
            kategori_id,
            soal_count: soal_list.length
          }
        });
      } catch (error) {
        // Rollback in case of error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating kumpulan soal:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memperbarui kumpulan soal'
      });
    }
  },

  // Delete kumpulan soal
  async deleteKumpulanSoal(req, res) {
    try {
      const { id } = req.params;

      // Start transaction
      await db.beginTransaction();

      try {
        // Delete soal first (foreign key constraint)
        await db.query('DELETE FROM soal WHERE kumpulan_id = ?', [id]);

        // Delete kumpulan_soal
        const [result] = await db.query(
          'DELETE FROM kumpulan_soal WHERE id = ?',
          [id]
        );

        if (result.affectedRows === 0) {
          await db.rollback();
          return res.status(404).json({
            status: 'error',
            message: 'Kumpulan soal tidak ditemukan'
          });
        }

        // Commit transaction
        await db.commit();

        res.json({
          status: 'success',
          message: 'Kumpulan soal berhasil dihapus'
        });
      } catch (error) {
        // Rollback in case of error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting kumpulan soal:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menghapus kumpulan soal'
      });
    }
  },

  // Get soal by kategori
  async getSoalByKategori(req, res) {
    try {
      const { kategoriId } = req.params;

      const [soal] = await db.query(
        `SELECT s.* 
         FROM soal s 
         JOIN kumpulan_soal ks ON s.kumpulan_id = ks.id 
         WHERE ks.kategori_id = ?`,
        [kategoriId]
      );

      res.json({
        status: 'success',
        data: soal
      });
    } catch (error) {
      console.error('Error getting soal by kategori:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data soal'
      });
    }
  }
};

module.exports = soalController;