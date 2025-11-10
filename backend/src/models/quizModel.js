const db = require('../config/db');

const QuizModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT q.*, ks.judul as kumpulan_soal_judul,
                   k.nama as kategori_nama,
                   u.nama as pembuat_nama,
                   ks.jumlah_soal
            FROM quiz q
            JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.id
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN users u ON q.created_by = u.id
            ORDER BY q.created_at DESC
        `);
        return rows;
    },

    getById: async (id) => {
        const [quiz] = await db.query(`
            SELECT q.*, ks.judul as kumpulan_soal_judul,
                   k.nama as kategori_nama,
                   u.nama as pembuat_nama,
                   ks.jumlah_soal
            FROM quiz q
            JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.id
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN users u ON q.created_by = u.id
            WHERE q.id = ?
        `, [id]);
        return quiz[0];
    },

    getActiveQuizzes: async () => {
        const [rows] = await db.query(`
            SELECT q.*, ks.judul as kumpulan_soal_judul,
                   k.nama as kategori_nama,
                   u.nama as pembuat_nama,
                   ks.jumlah_soal
            FROM quiz q
            JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.id
            JOIN kategori k ON ks.kategori_id = k.id
            JOIN users u ON q.created_by = u.id
            WHERE q.status = 'active'
              AND q.tanggal_mulai <= NOW()
              AND q.tanggal_selesai >= NOW()
            ORDER BY q.tanggal_mulai
        `);
        return rows;
    },

    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO quiz 
             (judul, deskripsi, kumpulan_soal_id, created_by, durasi,
              tanggal_mulai, tanggal_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.judul, data.deskripsi, data.kumpulan_soal_id,
             data.created_by, data.durasi, data.tanggal_mulai,
             data.tanggal_selesai, data.status || 'draft']
        );
        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE quiz 
             SET judul = ?, deskripsi = ?, kumpulan_soal_id = ?,
                 durasi = ?, tanggal_mulai = ?, tanggal_selesai = ?,
                 status = ?
             WHERE id = ? AND created_by = ?`,
            [data.judul, data.deskripsi, data.kumpulan_soal_id,
             data.durasi, data.tanggal_mulai, data.tanggal_selesai,
             data.status, id, data.created_by]
        );
        return result;
    },

    delete: async (id, userId) => {
        const [result] = await db.query(
            'DELETE FROM quiz WHERE id = ? AND created_by = ?',
            [id, userId]
        );
        return result;
    },

    createAttempt: async (data) => {
        const [result] = await db.query(
            `INSERT INTO quiz_attempts 
             (quiz_id, user_id, start_time, status)
             VALUES (?, ?, NOW(), 'in_progress')`,
            [data.quiz_id, data.user_id]
        );
        return result;
    },

    submitAnswer: async (data) => {
        const [result] = await db.query(
            `INSERT INTO user_answers 
             (attempt_id, soal_id, jawaban, is_correct, points_earned)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             jawaban = VALUES(jawaban),
             is_correct = VALUES(is_correct),
             points_earned = VALUES(points_earned)`,
            [data.attempt_id, data.soal_id, data.jawaban,
             data.is_correct, data.points_earned]
        );
        return result;
    },

    completeAttempt: async (id, score) => {
        const [result] = await db.query(
            `UPDATE quiz_attempts 
             SET end_time = NOW(), score = ?, status = 'completed'
             WHERE id = ?`,
            [score, id]
        );
        return result;
    },

    getQuizResults: async (quizId) => {
        const [rows] = await db.query(`
            SELECT qa.*, u.nama as user_nama,
                   COUNT(ua.id) as total_questions,
                   SUM(IF(ua.is_correct, 1, 0)) as correct_answers
            FROM quiz_attempts qa
            JOIN users u ON qa.user_id = u.id
            LEFT JOIN user_answers ua ON qa.id = ua.attempt_id
            WHERE qa.quiz_id = ?
            GROUP BY qa.id
            ORDER BY qa.score DESC, qa.end_time ASC
        `, [quizId]);
        return rows;
    },

    getUserAttempts: async (userId) => {
        const [rows] = await db.query(`
            SELECT qa.*, q.judul as quiz_judul,
                   COUNT(ua.id) as total_questions,
                   SUM(IF(ua.is_correct, 1, 0)) as correct_answers
            FROM quiz_attempts qa
            JOIN quiz q ON qa.quiz_id = q.id
            LEFT JOIN user_answers ua ON qa.id = ua.attempt_id
            WHERE qa.user_id = ?
            GROUP BY qa.id
            ORDER BY qa.start_time DESC
        `, [userId]);
        return rows;
    }
};

module.exports = QuizModel;