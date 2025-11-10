const db = require('../config/db');

const KategoriModel = {
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM kategori ORDER BY nama');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM kategori WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const [result] = await db.query(
            'INSERT INTO kategori (nama, deskripsi) VALUES (?, ?)',
            [data.nama, data.deskripsi]
        );
        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            'UPDATE kategori SET nama = ?, deskripsi = ? WHERE id = ?',
            [data.nama, data.deskripsi, id]
        );
        return result;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM kategori WHERE id = ?', [id]);
        return result;
    },

    checkUsage: async (id) => {
        const [materi] = await db.query('SELECT COUNT(*) as count FROM materi WHERE kategori_id = ?', [id]);
        const [soal] = await db.query('SELECT COUNT(*) as count FROM kumpulan_soal WHERE kategori_id = ?', [id]);
        return {
            materiCount: materi[0].count,
            soalCount: soal[0].count
        };
    }
};

module.exports = KategoriModel;