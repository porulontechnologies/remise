const newsletterService = require('../services/newsletterService');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

/**
 * Public: Subscribe to newsletter
 * POST /api/newsletter/subscribe
 */
const subscribe = async (req, res) => {
  try {
    const { email, source } = req.body;
    const result = await newsletterService.subscribe({
      email,
      source: source || 'footer',
    });

    if (result.isDuplicate) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      isDuplicate: false,
      message: result.message,
      data: {
        email: result.subscriber.email,
        status: result.subscriber.status,
        subscribedAt: result.subscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error('❌ [Newsletter Controller] subscribe error:', error.message);
    const statusCode = error.message.includes('valid email') || error.message.includes('enter your email') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to subscribe to newsletter',
    });
  }
};

/**
 * Public: Confirm subscription via token
 * GET /api/newsletter/confirm?token=...
 */
const confirm = async (req, res) => {
  try {
    const { token } = req.query;
    await newsletterService.confirmSubscription(token);
    
    // If browser request, redirect to frontend confirmation page or return HTML
    if (req.accepts('html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Subscription Confirmed - Remise</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, sans-serif; background: #0FA3B1; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #fff; color: #1e293b; padding: 40px; border-radius: 16px; text-align: center; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            h2 { color: #0FA3B1; margin-top: 0; }
            a { display: inline-block; background: #FF0000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Subscription Confirmed! 🎉</h2>
            <p>You have successfully verified your email for Remise newsletter updates.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}">Continue to Remise</a>
          </div>
        </body>
        </html>
      `);
    }

    res.json({ success: true, message: 'Subscription confirmed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Public: Unsubscribe via secure token
 * GET & POST /api/newsletter/unsubscribe?token=...
 */
const unsubscribe = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    await newsletterService.unsubscribe(token);

    if (req.method === 'GET' && req.accepts('html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed - Remise</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #fff; padding: 40px; border-radius: 16px; text-align: center; max-width: 440px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            h2 { color: #e11d48; margin-top: 0; }
            a { display: inline-block; background: #0FA3B1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>You have unsubscribed</h2>
            <p>You will no longer receive newsletter and promotional emails from Remise.</p>
            <p style="font-size: 13px; color: #64748b;">Changed your mind? You can subscribe again anytime from our website footer.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}">Return to Remise</a>
          </div>
        </body>
        </html>
      `);
    }

    res.json({ success: true, message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get all subscribers with search, status filtering, and stats
 * GET /api/admin/newsletter/subscribers
 */
const getSubscribers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total, totalActive, totalUnsubscribed, totalUnconfirmed] = await Promise.all([
      NewsletterSubscriber.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NewsletterSubscriber.countDocuments(filter),
      NewsletterSubscriber.countDocuments({ status: 'active' }),
      NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
      NewsletterSubscriber.countDocuments({ status: 'unconfirmed' }),
    ]);

    res.json({
      success: true,
      data: subscribers,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: {
        totalSubscribers: totalActive + totalUnsubscribed + totalUnconfirmed,
        active: totalActive,
        unsubscribed: totalUnsubscribed,
        unconfirmed: totalUnconfirmed,
      },
    });
  } catch (error) {
    console.error('❌ [Newsletter Controller] getSubscribers error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
};

/**
 * Admin: Send campaign / product digest / test email
 * POST /api/admin/newsletter/send
 */
const sendCampaign = async (req, res) => {
  try {
    const { subject, title, body, products, offers, blogArticle, testEmailOnly, adminEmail } = req.body;
    
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    const result = await newsletterService.sendNewsletterCampaign({
      subject,
      title,
      body,
      products,
      offers,
      blogArticle,
      testEmailOnly,
      adminEmail: adminEmail || req.user?.email,
    });

    res.json({
      success: true,
      message: testEmailOnly ? 'Test preview email sent successfully' : 'Campaign dispatched to subscribers',
      data: result,
    });
  } catch (error) {
    console.error('❌ [Newsletter Controller] sendCampaign error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to dispatch campaign' });
  }
};

/**
 * Admin / Internal: Notify active subscribers about a newly published offer
 * POST /api/admin/newsletter/notify-offer
 */
const notifyOffer = async (req, res) => {
  try {
    const { offer } = req.body;
    if (!offer) return res.status(400).json({ success: false, message: 'Offer object is required' });

    const result = await newsletterService.sendOfferNotification(offer);
    res.json({ success: true, message: 'Offer notification sent to subscribers', data: result });
  } catch (error) {
    console.error('❌ [Newsletter Controller] notifyOffer error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin / Internal: Notify active subscribers about a blog post
 * POST /api/admin/newsletter/notify-blog
 */
const notifyBlog = async (req, res) => {
  try {
    const { article } = req.body;
    if (!article) return res.status(400).json({ success: false, message: 'Article object is required' });

    const result = await newsletterService.sendBlogNotification(article);
    res.json({ success: true, message: 'Blog notification sent to subscribers', data: result });
  } catch (error) {
    console.error('❌ [Newsletter Controller] notifyBlog error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete a subscriber
 * DELETE /api/admin/newsletter/subscribers/:id
 */
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await NewsletterSubscriber.findByIdAndDelete(id);
    res.json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subscriber' });
  }
};

module.exports = {
  subscribe,
  confirm,
  unsubscribe,
  getSubscribers,
  sendCampaign,
  notifyOffer,
  notifyBlog,
  deleteSubscriber,
};
