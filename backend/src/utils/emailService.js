const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailService = {
    sendVerificationEmail: async (email, token) => {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verifikasi Email QuizMaster',
            html: `
                <h1>Selamat Datang di QuizMaster!</h1>
                <p>Silakan klik link di bawah ini untuk memverifikasi email Anda:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>Link ini akan kadaluarsa dalam 24 jam.</p>
            `
        };

        await transporter.sendMail(mailOptions);
    },

    sendResetPasswordEmail: async (email, token) => {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password QuizMaster',
            html: `
                <h1>Reset Password</h1>
                <p>Silakan klik link di bawah ini untuk mereset password Anda:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Link ini akan kadaluarsa dalam 1 jam.</p>
            `
        };

        await transporter.sendMail(mailOptions);
    }
};

module.exports = emailService;