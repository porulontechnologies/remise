const express = require('express');
const router = express.Router();
const newsletterCtrl = require('../controllers/newsletterController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// ─── Public routes ───────────────────────────────────────────────────────────
router.post('/subscribe', newsletterCtrl.subscribe);
router.get('/confirm', newsletterCtrl.confirm);
router.get('/unsubscribe', newsletterCtrl.unsubscribe);
router.post('/unsubscribe', newsletterCtrl.unsubscribe);

// ─── Protected Admin routes ──────────────────────────────────────────────────
router.get('/admin/subscribers', protect, verifyAdmin, newsletterCtrl.getSubscribers);
router.post('/admin/send', protect, verifyAdmin, newsletterCtrl.sendCampaign);
router.post('/admin/notify-offer', protect, verifyAdmin, newsletterCtrl.notifyOffer);
router.post('/admin/notify-blog', protect, verifyAdmin, newsletterCtrl.notifyBlog);
router.delete('/admin/subscribers/:id', protect, verifyAdmin, newsletterCtrl.deleteSubscriber);

module.exports = router;
