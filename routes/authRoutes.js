const router = require('express').Router();

const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,  
  forgotPassword,
  resetPassword,
  getUserById,
  deleteAccount,
   verifyEmail,     
  resendVerificationCode 
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);
router.post('/login', login);
router.post('/logout', protect, logout);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);  // ✅ ADD THIS

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/user/:userId', protect, getUserById);
router.delete('/account', protect, deleteAccount);
// ✨ Email Verification routes



module.exports = router;