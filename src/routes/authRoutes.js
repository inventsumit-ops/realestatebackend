const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getProfile,
  updateProfile,
  deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-otp', resendVerificationEmail);
router.get('/profile', protect, getProfile);
router.put('/update-profile', protect, updateProfile);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
