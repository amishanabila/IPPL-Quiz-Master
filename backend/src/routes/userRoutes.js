const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/verify-email/:token', UserController.verifyEmail);
router.post('/request-reset-password', UserController.requestResetPassword);
router.post('/reset-password', UserController.resetPassword);

// Protected routes
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, UserController.updateProfile);

module.exports = router;