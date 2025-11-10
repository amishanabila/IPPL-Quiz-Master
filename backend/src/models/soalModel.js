const db = require('../config/db');

const SoalModel = {
    getAllKumpulan: async () => {
        const [rows] = await db.query(`
            SELECT ks.*, k.nama as kategori_nama, m.judul as materi_judul,
                   u.nama as pembuat_nama
            FROM kumpulan_soal ks
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN materi m ON ks.materi_id = m.id
            JOIN users u ON ks.created_by = u.id
            ORDER BY ks.created_at DESC
        `);
        return rows;
    },

    getKumpulanById: async (id) => {
        const [kumpulan] = await db.query(`
            SELECT ks.*, k.nama as kategori_nama, m.judul as materi_judul,
                   u.nama as pembuat_nama
            FROM kumpulan_soal ks
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN materi m ON ks.materi_id = m.id
            JOIN users u ON ks.created_by = u.id
            WHERE ks.id = ?
        `, [id]);

        if (kumpulan[0]) {
            // Get soal
            const [soalList] = await db.query(`
                SELECT s.*, 
                    CASE 
                        WHEN s.jenis = 'pilihan_ganda' THEN 
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', oj.id,
                                    'teks', oj.teks,
                                    'benar', oj.benar
                                )
                            )
                        ELSE NULL
                    END as opsi,
                    CASE 
                        WHEN s.jenis IN ('isian_singkat', 'essay') THEN 
                            (SELECT JSON_OBJECT('teks', j.teks, 'keterangan', j.keterangan)
                             FROM jawaban j 
                             WHERE j.soal_id = s.id)
                        ELSE NULL
                    END as jawaban
                FROM soal s
                LEFT JOIN opsi_jawaban oj ON s.id = oj.soal_id
                WHERE s.kumpulan_id = ?
                GROUP BY s.id
                ORDER BY s.urutan
            `, [id]);

            kumpulan[0].soal_list = soalList;
        }

        return kumpulan[0];
    },

    getByKategori: async (kategoriId) => {
        const [rows] = await db.query(`
            SELECT ks.*, k.nama as kategori_nama, m.judul as materi_judul,
                   u.nama as pembuat_nama
            FROM kumpulan_soal ks
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN materi m ON ks.materi_id = m.id
            JOIN users u ON ks.created_by = u.id
            WHERE ks.kategori_id = ?
            ORDER BY ks.created_at DESC
        `, [kategoriId]);
        return rows;
    },

    createKumpulan: async (data, soalList) => {
        try {
            await db.query('START TRANSACTION');

            // Insert kumpulan_soal
            const [kumpulan] = await db.query(
                `INSERT INTO kumpulan_soal 
                 (judul, deskripsi, materi_id, kategori_id, created_by, jumlah_soal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [data.judul, data.deskripsi, data.materi_id, data.kategori_id, 
                 data.created_by, soalList.length]
            );

            // Insert soal and jawaban
            for (const [index, soal] of soalList.entries()) {
                const [soalResult] = await db.query(
                    `INSERT INTO soal 
                     (kumpulan_id, urutan, jenis, pertanyaan, gambar_url, poin)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [kumpulan.insertId, index + 1, soal.jenis, soal.pertanyaan,
                     soal.gambar_url, soal.poin || 1]
                );

                if (soal.jenis === 'pilihan_ganda' && soal.opsi) {
                    for (const [i, opsi] of soal.opsi.entries()) {
                        await db.query(
                            `INSERT INTO opsi_jawaban 
                             (soal_id, urutan, teks, benar)
                             VALUES (?, ?, ?, ?)`,
                            [soalResult.insertId, i + 1, opsi.teks, opsi.benar]
                        );
                    }
                } else {
                    await db.query(
                        `INSERT INTO jawaban 
                         (soal_id, teks, keterangan)
                         VALUES (?, ?, ?)`,
                        [soalResult.insertId, soal.jawaban.teks, 
                         soal.jawaban.keterangan]
                    );
                }
            }

            await db.query('COMMIT');
            return kumpulan;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    },

    updateKumpulan: async (id, data, soalList) => {
        try {
            await db.query('START TRANSACTION');

            // Update kumpulan_soal
            const [kumpulan] = await db.query(
                `UPDATE kumpulan_soal 
                 SET judul = ?, deskripsi = ?, materi_id = ?, 
                     kategori_id = ?, jumlah_soal = ?
                 WHERE id = ? AND created_by = ?`,
                [data.judul, data.deskripsi, data.materi_id, data.kategori_id,
                 soalList.length, id, data.created_by]
            );

            if (kumpulan.affectedRows === 0) {
                throw new Error('Unauthorized');
            }

            // Delete existing soal (cascades to opsi_jawaban and jawaban)
            await db.query('DELETE FROM soal WHERE kumpulan_id = ?', [id]);

            // Insert updated soal
            for (const [index, soal] of soalList.entries()) {
                const [soalResult] = await db.query(
                    `INSERT INTO soal 
                     (kumpulan_id, urutan, jenis, pertanyaan, gambar_url, poin)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, index + 1, soal.jenis, soal.pertanyaan,
                     soal.gambar_url, soal.poin || 1]
                );

                if (soal.jenis === 'pilihan_ganda' && soal.opsi) {
                    for (const [i, opsi] of soal.opsi.entries()) {
                        await db.query(
                            `INSERT INTO opsi_jawaban 
                             (soal_id, urutan, teks, benar)
                             VALUES (?, ?, ?, ?)`,
                            [soalResult.insertId, i + 1, opsi.teks, opsi.benar]
                        );
                    }
                } else {
                    await db.query(
                        `INSERT INTO jawaban 
                         (soal_id, teks, keterangan)
                         VALUES (?, ?, ?)`,
                        [soalResult.insertId, soal.jawaban.teks,
                         soal.jawaban.keterangan]
                    );
                }
            }

            await db.query('COMMIT');
            return kumpulan;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    },

    deleteKumpulan: async (id, userId) => {
        try {
            await db.query('START TRANSACTION');

            // Check if kumpulan is being used in quiz
            const [quizUsage] = await db.query(
                'SELECT id FROM quiz WHERE kumpulan_soal_id = ?',
                [id]
            );

            if (quizUsage.length > 0) {
                throw new Error('Soal sedang digunakan dalam quiz');
            }

            // Delete kumpulan (cascades to soal, opsi_jawaban, and jawaban)
            const [result] = await db.query(
                'DELETE FROM kumpulan_soal WHERE id = ? AND created_by = ?',
                [id, userId]
            );

            await db.query('COMMIT');
            return result;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
};

module.exports = SoalModel;