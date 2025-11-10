const KategoriModel = require('../models/kategoriModel');

const KategoriController = {
    getAll: async (req, res) => {
        try {
            const kategori = await KategoriModel.getAll();
            res.json({
                success: true,
                data: kategori
            });
        } catch (error) {
            console.error('Get kategori error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil data kategori'
            });
        }
    },

    getById: async (req, res) => {
        try {
            const kategori = await KategoriModel.getById(req.params.id);
            if (!kategori) {
                return res.status(404).json({
                    success: false,
                    message: 'Kategori tidak ditemukan'
                });
            }
            res.json({
                success: true,
                data: kategori
            });
        } catch (error) {
            console.error('Get kategori by id error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil data kategori'
            });
        }
    },

    create: async (req, res) => {
        try {
            const { nama, deskripsi } = req.body;

            // Validasi input
            if (!nama) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama kategori harus diisi'
                });
            }

            const result = await KategoriModel.create({ nama, deskripsi });
            res.status(201).json({
                success: true,
                message: 'Kategori berhasil dibuat',
                data: {
                    id: result.insertId,
                    nama,
                    deskripsi
                }
            });
        } catch (error) {
            console.error('Create kategori error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Kategori dengan nama tersebut sudah ada'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat membuat kategori'
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nama, deskripsi } = req.body;

            // Validasi input
            if (!nama) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama kategori harus diisi'
                });
            }

            // Cek kategori exists
            const kategori = await KategoriModel.getById(id);
            if (!kategori) {
                return res.status(404).json({
                    success: false,
                    message: 'Kategori tidak ditemukan'
                });
            }

            const result = await KategoriModel.update(id, { nama, deskripsi });
            res.json({
                success: true,
                message: 'Kategori berhasil diperbarui',
                data: {
                    id,
                    nama,
                    deskripsi
                }
            });
        } catch (error) {
            console.error('Update kategori error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Kategori dengan nama tersebut sudah ada'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui kategori'
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Cek penggunaan kategori
            const usage = await KategoriModel.checkUsage(id);
            if (usage.materiCount > 0 || usage.soalCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Kategori tidak dapat dihapus karena sedang digunakan'
                });
            }

            const result = await KategoriModel.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Kategori tidak ditemukan'
                });
            }

            res.json({
                success: true,
                message: 'Kategori berhasil dihapus'
            });
        } catch (error) {
            console.error('Delete kategori error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat menghapus kategori'
            });
        }
    }
};

module.exports = KategoriController;