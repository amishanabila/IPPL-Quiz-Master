const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/emailService');

const UserController = {
    register: async (req, res) => {
        try {
            const { nama, email, password, konfirmasiPassword } = req.body;

            // Validasi input
            if (!nama || !email || !password || !konfirmasiPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Semua field harus diisi'
                });
            }

            // Validasi format email
            const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email harus @gmail.com dan menggunakan huruf kecil'
                });
            }

            // Validasi nama
            const nameRegex = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\\s]+$/;
            if (!nameRegex.test(nama)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama harus mengandung huruf besar dan kecil, hanya huruf dan spasi'
                });
            }

            // Validasi password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[\\S]{8,12}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password harus 8-12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol'
                });
            }

            // Validasi konfirmasi password
            if (password !== konfirmasiPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password dan konfirmasi password tidak cocok'
                });
            }

            // Cek email sudah terdaftar
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah terdaftar'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Generate verification token
            const verificationToken = jwt.sign(
                { email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Simpan user
            const userData = {
                nama,
                email,
                password: hashedPassword,
                verification_token: verificationToken
            };

            await UserModel.create(userData);

            // Kirim email verifikasi
            await sendVerificationEmail(email, verificationToken);

            res.status(201).json({
                success: true,
                message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.'
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat registrasi'
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email dan password harus diisi'
                });
            }

            // Cek user exists
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Cek verifikasi email
            if (!user.is_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email belum diverifikasi. Silakan cek email Anda untuk verifikasi.'
                });
            }

            // Verifikasi password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Remove sensitive data
            delete user.password;
            delete user.verification_token;
            delete user.reset_token;

            res.json({
                success: true,
                message: 'Login berhasil',
                token,
                user
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat login'
            });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.params;
            
            // Verifikasi token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Update status verifikasi user
            const result = await UserModel.verifyEmail(decoded.email, token);

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Token verifikasi tidak valid atau sudah digunakan'
                });
            }

            res.json({
                success: true,
                message: 'Email berhasil diverifikasi'
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(400).json({
                    success: false,
                    message: 'Token verifikasi sudah kadaluarsa'
                });
            } else {
                console.error('Verify email error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat verifikasi email'
                });
            }
        }
    },

    requestResetPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email harus diisi'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user || !user.is_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email tidak ditemukan atau belum diverifikasi'
                });
            }

            const resetToken = jwt.sign(
                { email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            await UserModel.updateResetToken(email, resetToken);
            await sendResetPasswordEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Instruksi reset password telah dikirim ke email Anda'
            });

        } catch (error) {
            console.error('Request reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memproses permintaan reset password'
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, password, konfirmasiPassword } = req.body;

            if (!token || !password || !konfirmasiPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Semua field harus diisi'
                });
            }

            if (password !== konfirmasiPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password dan konfirmasi password tidak cocok'
                });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[\\S]{8,12}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password harus 8-12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await UserModel.resetPassword(decoded.email, hashedPassword);

            res.json({
                success: true,
                message: 'Password berhasil direset'
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(400).json({
                    success: false,
                    message: 'Token reset password sudah kadaluarsa'
                });
            } else {
                console.error('Reset password error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat reset password'
                });
            }
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await UserModel.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil profil'
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { nama } = req.body;

            if (!nama) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama harus diisi'
                });
            }

            const nameRegex = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\\s]+$/;
            if (!nameRegex.test(nama)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama harus mengandung huruf besar dan kecil, hanya huruf dan spasi'
                });
            }

            const result = await UserModel.updateProfile(req.user.userId, nama);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            res.json({
                success: true,
                message: 'Profil berhasil diperbarui'
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui profil'
            });
        }
    }
};

module.exports = UserController;