const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../utils/emailService');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { nama, email, password } = req.body;

      // Validasi input
      if (!nama || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama, email, dan password wajib diisi'
        });
      }

      // Check if user already exists
      const [existingUsers] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Email sudah terdaftar'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const [result] = await db.query(
        'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
        [nama, email, hashedPassword]
      );

      // Generate token
      const token = jwt.sign(
        { id: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil',
        data: {
          user: {
            id: result.insertId,
            nama,
            email
          },
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat registrasi'
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email dan password wajib diisi'
        });
      }

      // Check if user exists
      const [users] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      const user = users[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        status: 'success',
        message: 'Login berhasil',
        data: {
          user: {
            id: user.id,
            nama: user.nama,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat login'
      });
    }
  },

  // Request password reset
  async resetPasswordRequest(req, res) {
    try {
      const { email } = req.body;

      // Validasi input
      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email wajib diisi'
        });
      }

      // Check if user exists
      const [users] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Email tidak terdaftar'
        });
      }

      const user = users[0];

      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token to database
      await db.query(
        'UPDATE users SET reset_token = ? WHERE id = ?',
        [resetToken, user.id]
      );

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        status: 'success',
        message: 'Email reset password telah dikirim'
      });
    } catch (error) {
      console.error('Reset password request error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat memproses permintaan reset password'
      });
    }
  },

  // Verify reset token and reset password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Validasi input
      if (!token || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Token dan password baru wajib diisi'
        });
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user with reset token
        const [users] = await db.query(
          'SELECT * FROM users WHERE id = ? AND reset_token = ?',
          [decoded.id, token]
        );

        if (users.length === 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Token tidak valid atau kadaluarsa'
          });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await db.query(
          'UPDATE users SET password = ?, reset_token = NULL WHERE id = ?',
          [hashedPassword, decoded.id]
        );

        res.json({
          status: 'success',
          message: 'Password berhasil direset'
        });
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(400).json({
            status: 'error',
            message: 'Token telah kadaluarsa, silakan minta reset password lagi'
          });
        }
        throw jwtError;
      }
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat reset password'
      });
    }
  }
};

module.exports = authController;