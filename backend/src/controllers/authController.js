const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const emailService = require('../utils/emailService');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { nama, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email sudah terdaftar'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        nama,
        email,
        password: hashedPassword
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil',
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

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
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

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Email tidak terdaftar'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token to user
      await User.updateResetToken(user.id, resetToken);

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

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.reset_token !== token) {
        return res.status(400).json({
          status: 'error',
          message: 'Token tidak valid atau kadaluarsa'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await User.updatePassword(user.id, hashedPassword);

      res.json({
        status: 'success',
        message: 'Password berhasil direset'
      });
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