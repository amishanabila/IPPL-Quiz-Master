const db = require('../config/db');

const UserModel = {
    create: async (userData) => {
        const [result] = await db.query(
            'INSERT INTO users (nama, email, password, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)',
            [userData.nama, userData.email, userData.password, userData.verification_token, false]
        );
        return result;
    },

    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await db.query('SELECT id, nama, email, role, is_verified, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    updateProfile: async (id, nama) => {
        const [result] = await db.query('UPDATE users SET nama = ? WHERE id = ?', [nama, id]);
        return result;
    },

    verifyEmail: async (email, token) => {
        const [result] = await db.query(
            'UPDATE users SET is_verified = true, verification_token = NULL WHERE email = ? AND verification_token = ?',
            [email, token]
        );
        return result;
    },

    updateResetToken: async (email, token) => {
        const [result] = await db.query(
            'UPDATE users SET reset_token = ? WHERE email = ?',
            [token, email]
        );
        return result;
    },

    resetPassword: async (email, password) => {
        const [result] = await db.query(
            'UPDATE users SET password = ?, reset_token = NULL WHERE email = ?',
            [password, email]
        );
        return result;
    }
};

module.exports = UserModel;