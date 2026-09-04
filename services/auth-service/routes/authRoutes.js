const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register, login, googleCallback, googleSuccess,
  getProfile, updateProfile, logout, logoutAll,
  forgotPassword, resetPassword,
  verifyEmail, resendVerification, upgradeToStoreOwner,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

router.get('/google', (req, res, next) => {
  const rawRole = req.query.role || req.query.state || '';
  const allowedRoles = ['customer', 'user', 'store_owner', 'wholesaler', 'whole_saler', 'home_business'];
  const role = allowedRoles.includes(rawRole) ? rawRole : 'customer';

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: JSON.stringify({ role }),
  })(req, res, next);
});
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app'}/auth?error=google_auth_failed` }),
  googleCallback
);
router.post('/google/success', googleSuccess);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ── Email verification ────────────────────────────────────────────────────────
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

const Token = require('../models/Token');

// ── Internal (service-to-service only) ───────────────────────────────────────
router.post('/internal/upgrade-role', upgradeToStoreOwner); // open — accepts { email } in body
router.get('/internal/tokens-count', async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    res.json({ success: true, data: { tokensUsed: totalTokens || 0 } });
  } catch (err) {
    res.json({ success: true, data: { tokensUsed: 0 } });
  }
});

router.get('/admin', protect, authorize('admin'), (req, res) =>
  res.json({ success: true, message: 'Welcome admin!', data: req.user })
);
router.get('/moderator', protect, authorize('admin', 'moderator'), (req, res) =>
  res.json({ success: true, message: 'Welcome moderator or admin!', data: req.user })
);

module.exports = router;
