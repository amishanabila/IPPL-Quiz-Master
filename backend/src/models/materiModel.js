const db = require('../config/db');

const MateriModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT m.*, k.nama as kategori_nama, u.nama as pembuat_nama
            FROM materi m
            JOIN kategori k ON m.kategori_id = k.id
            JOIN users u ON m.created_by = u.id
            ORDER BY m.created_at DESC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT m.*, k.nama as kategori_nama, u.nama as pembuat_nama
            FROM materi m
            JOIN kategori k ON m.kategori_id = k.id
            JOIN users u ON m.created_by = u.id
            WHERE m.id = ?
        `, [id]);
        return rows[0];
    },

    getByKategori: async (kategoriId) => {
        const [rows] = await db.query(`
            SELECT m.*, k.nama as kategori_nama, u.nama as pembuat_nama
            FROM materi m
            JOIN kategori k ON m.kategori_id = k.id
            JOIN users u ON m.created_by = u.id
            WHERE m.kategori_id = ?
            ORDER BY m.created_at DESC
        `, [kategoriId]);
        return rows;
    },

    create: async (data) => {
        const [result] = await db.query(
            'INSERT INTO materi (judul, deskripsi, konten, kategori_id, created_by) VALUES (?, ?, ?, ?, ?)',
            [data.judul, data.deskripsi, data.konten, data.kategori_id, data.created_by]
        );
        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            'UPDATE materi SET judul = ?, deskripsi = ?, konten = ?, kategori_id = ? WHERE id = ? AND created_by = ?',
            [data.judul, data.deskripsi, data.konten, data.kategori_id, id, data.created_by]
        );
        return result;
    },

    delete: async (id, userId) => {
        const [result] = await db.query(
            'DELETE FROM materi WHERE id = ? AND created_by = ?',
            [id, userId]
        );
        return result;
    },

    checkUsage: async (id) => {
        const [soal] = await db.query(
            'SELECT COUNT(*) as count FROM kumpulan_soal WHERE materi_id = ?',
            [id]
        );
        return soal[0].count;
    }
};

module.exports = MateriModel;