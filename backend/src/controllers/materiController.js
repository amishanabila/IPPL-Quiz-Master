const db = require('../config/db');

const materiController = {
  // Get all materi or filter by kategori
  async getMateri(req, res) {
    try {
      const { kategori_id } = req.query;
      let query = 'SELECT * FROM materi';
      let params = [];

      if (kategori_id) {
        query = 'SELECT * FROM materi WHERE kategori_id = ?';
        params = [kategori_id];
      }

      const [materi] = await db.query(query, params);

      res.json({
        status: 'success',
        data: materi
      });
    } catch (error) {
      console.error('Error getting materi:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data materi'
      });
    }
  },

  // Get materi by id
  async getMateriById(req, res) {
    try {
      const { id } = req.params;
      const [materi] = await db.query(
        'SELECT * FROM materi WHERE id = ?',
        [id]
      );

      if (materi.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Materi tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        data: materi[0]
      });
    } catch (error) {
      console.error('Error getting materi by id:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data materi'
      });
    }
  },

  // Create new materi
  async createMateri(req, res) {
    try {
      const { judul, deskripsi, kategori_id, isi_materi } = req.body;

      const [result] = await db.query(
        'INSERT INTO materi (judul, deskripsi, kategori_id, isi_materi) VALUES (?, ?, ?, ?)',
        [judul, deskripsi, kategori_id, isi_materi]
      );

      res.status(201).json({
        status: 'success',
        message: 'Materi berhasil dibuat',
        data: {
          id: result.insertId,
          judul,
          deskripsi,
          kategori_id,
          isi_materi
        }
      });
    } catch (error) {
      console.error('Error creating materi:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat materi'
      });
    }
  },

  // Update materi
  async updateMateri(req, res) {
    try {
      const { id } = req.params;
      const { judul, deskripsi, kategori_id, isi_materi } = req.body;

      const [result] = await db.query(
        'UPDATE materi SET judul = ?, deskripsi = ?, kategori_id = ?, isi_materi = ? WHERE id = ?',
        [judul, deskripsi, kategori_id, isi_materi, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Materi tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Materi berhasil diperbarui',
        data: {
          id,
          judul,
          deskripsi,
          kategori_id,
          isi_materi
        }
      });
    } catch (error) {
      console.error('Error updating materi:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memperbarui materi'
      });
    }
  },

  // Delete materi
  async deleteMateri(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        'DELETE FROM materi WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Materi tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Materi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting materi:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menghapus materi'
      });
    }
  }
};

module.exports = materiController;