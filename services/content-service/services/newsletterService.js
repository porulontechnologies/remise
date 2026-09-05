const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendMail } = require('../utils/sendEmail');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

/**
 * Validate email format with standard regex
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Common HTML email wrapper for all newsletter & notification templates
 */
function emailLayout({ title, contentHtml, unsubscribeToken }) {
  const unsubscribeUrl = unsubscribeToken
    ? `${FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`
    : `${FRONTEND_URL}/unsubscribe`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Remise Newsletter'}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 30px 10px; }
        .main-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0FA3B1 0%, #0d8b97 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .header-logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; }
        .header-logo span { color: #FF0000; }
        .header-tagline { font-size: 13px; color: #e0f2fe; margin-top: 6px; font-weight: 500; }
        .content { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        .btn-primary { display: inline-block; background: #FF0000; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0; }
        .product-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; background: #ffffff; }
        .product-img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; margin-bottom: 12px; background: #f8fafc; }
        .product-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .product-price { font-size: 16px; font-weight: 800; color: #0FA3B1; margin-bottom: 8px; }
        .unsub-link { color: #94a3b8; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main-card">
          <div class="header">
            <h1 class="header-logo">R<span>E</span>mise</h1>
            <div class="header-tagline">Stay in the Loop · Exclusive Deals & Updates</div>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">Porulon Technologies Private Limited</p>
            <p style="margin: 0 0 12px 0;">Coimbatore, Tamil Nadu, India · <a href="mailto:porulontechnologies@gmail.com" style="color: #0FA3B1; text-decoration: none;">porulontechnologies@gmail.com</a></p>
            <p style="margin: 0; font-size: 11px;">
              You received this email because you subscribed to Remise updates.<br>
              <a href="${unsubscribeUrl}" class="unsub-link">Unsubscribe instantly from newsletter</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Subscribe or Reactivate an email
 */
async function subscribe({ email, source = 'footer' }) {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  let subscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });

  if (subscriber) {
    if (subscriber.status === 'active') {
      return {
        isDuplicate: true,
        message: 'This email is already subscribed',
        subscriber,
      };
    }

    // Reactivate previously unsubscribed or unconfirmed user
    subscriber.status = 'active';
    subscriber.unsubscribedAt = null;
    subscriber.subscribedAt = new Date();
    subscriber.source = source || subscriber.source;
    if (!subscriber.unsubscribeToken) {
      subscriber.unsubscribeToken = require('crypto').randomBytes(24).toString('hex');
    }
    const token = subscriber.generateConfirmationToken();
    await subscriber.save();

    // Send confirmation/welcome email
    await sendWelcomeConfirmationEmail(subscriber).catch(err =>
      console.error('⚠️ [Newsletter] Failed to send welcome email:', err.message)
    );

    return {
      isDuplicate: false,
      isReactivated: true,
      message: 'Thanks for subscribing! Check your inbox to confirm.',
      subscriber,
    };
  }

  // Create brand new subscriber
  subscriber = new NewsletterSubscriber({
    email: normalizedEmail,
    status: 'active',
    source: source || 'footer',
    subscribedAt: new Date(),
  });
  subscriber.generateConfirmationToken();
  await subscriber.save();

  // Send confirmation/welcome email
  await sendWelcomeConfirmationEmail(subscriber).catch(err =>
    console.error('⚠️ [Newsletter] Failed to send welcome email:', err.message)
  );

  return {
    isDuplicate: false,
    isNew: true,
    message: 'Thanks for subscribing! Check your inbox to confirm.',
    subscriber,
  };
}

/**
 * 2. Send Welcome & Confirmation Email
 */
async function sendWelcomeConfirmationEmail(subscriber) {
  const confirmUrl = `${FRONTEND_URL}/api/newsletter/confirm?token=${subscriber.confirmationToken}`;
  const exploreUrl = `${FRONTEND_URL}/nearby`;

  const contentHtml = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">Welcome to the Remise Inner Circle! 🎉</h2>
    <p style="color: #475569; font-size: 15px;">
      Thanks for subscribing! You are now set to receive exclusive discounts, flash deals, new product launches, and seasonal collections directly in your inbox.
    </p>
    <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0f766e;">Confirm your subscription & start exploring:</p>
      <a href="${exploreUrl}" class="btn-primary" style="margin: 0;">Explore Deals & Offers</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">
      If you did not sign up for Remise newsletter, you can safely ignore this email or unsubscribe below.
    </p>
  `;

  return sendMail({
    to: subscriber.email,
    subject: 'Welcome to Remise Newsletter! 🎉',
    html: emailLayout({
      title: 'Welcome to Remise Newsletter',
      contentHtml,
      unsubscribeToken: subscriber.unsubscribeToken,
    }),
  });
}

/**
 * 3. Confirm Subscription
 */
async function confirmSubscription(token) {
  if (!token) throw new Error('Token is required');
  const subscriber = await NewsletterSubscriber.findOne({
    confirmationToken: token,
  });

  if (!subscriber) {
    throw new Error('Invalid or expired confirmation link');
  }

  subscriber.status = 'active';
  subscriber.confirmedAt = new Date();
  subscriber.confirmationToken = null;
  subscriber.confirmationTokenExpires = null;
  await subscriber.save();

  return subscriber;
}

/**
 * 4. Unsubscribe with secure token
 */
async function unsubscribe(token) {
  if (!token) throw new Error('Unsubscribe token is required');
  const subscriber = await NewsletterSubscriber.findOne({
    unsubscribeToken: token,
  });

  if (!subscriber) {
    throw new Error('Invalid unsubscribe link or user not found');
  }

  subscriber.status = 'unsubscribed';
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  return subscriber;
}

/**
 * 5. Get Active Subscribers
 */
async function getActiveSubscribers() {
  return await NewsletterSubscriber.find({ status: 'active' }).select('email unsubscribeToken');
}

/**
 * Helper: Batch send emails with safe concurrency and pause
 */
async function batchSendEmails({ recipients, subject, generateHtmlForRecipient, batchSize = 15, delayMs = 300 }) {
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);
    await Promise.allSettled(
      chunk.map(async (r) => {
        try {
          const html = generateHtmlForRecipient(r);
          await sendMail({ to: r.email, subject, html });
          successCount++;
        } catch (err) {
          console.error(`⚠️ [Newsletter Batch] Error sending to ${r.email}:`, err.message);
          failureCount++;
        }
      })
    );

    if (i + batchSize < recipients.length && delayMs > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return { successCount, failureCount, total: recipients.length };
}

/**
 * 6. Send Campaign / Digest
 */
async function sendNewsletterCampaign({
  subject,
  title,
  body,
  products = [],
  offers = [],
  blogArticle = null,
  testEmailOnly = false,
  adminEmail = null,
}) {
  if (!subject) throw new Error('Subject is required');

  let productsHtml = '';
  if (products && products.length > 0) {
    productsHtml = `
      <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0FA3B1; padding-bottom: 6px; margin: 24px 0 16px 0;">
        🌟 Featured Products
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${products
          .map((p) => {
            const productImg = p.images?.length
              ? (p.images[0].startsWith('http') ? p.images[0] : `${FRONTEND_URL}${p.images[0]}`)
              : 'https://placehold.co/400x300?text=Product';
            const productLink = `${FRONTEND_URL}/product/${p._id || p.id}`;
            return `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="90" valign="top" style="padding-right: 16px;">
                        <img src="${productImg}" alt="${p.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
                      </td>
                      <td valign="top">
                        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.title}</div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">${p.description ? p.description.slice(0, 90) + '...' : ''}</div>
                        <div style="font-size: 15px; font-weight: 800; color: #0FA3B1;">₹${(p.price || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td width="100" align="right" valign="middle">
                        <a href="${productLink}" style="display: inline-block; background: #0FA3B1; color: #ffffff; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 6px; text-decoration: none;">View Item</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          })
          .join('')}
      </table>
    `;
  }

  let offersHtml = '';
  if (offers && offers.length > 0) {
    offersHtml = `
      <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #FF0000; padding-bottom: 6px; margin: 24px 0 16px 0;">
        🏷️ Exclusive Offers & Flash Deals
      </h3>
      ${offers
        .map((o) => `
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
            <div style="font-size: 16px; font-weight: 800; color: #9f1239;">${o.title}</div>
            <div style="font-size: 13px; color: #881337; margin: 4px 0 10px 0;">${o.description || ''}</div>
            ${o.discountPercent ? `<span style="background: #FF0000; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 8px; border-radius: 4px;">${o.discountPercent}% OFF</span>` : ''}
            <a href="${FRONTEND_URL}/nearby" style="display: inline-block; margin-left: 12px; font-size: 13px; font-weight: 700; color: #be123c; text-decoration: underline;">Claim Offer →</a>
          </div>
        `)
        .join('')}
    `;
  }

  let blogHtml = '';
  if (blogArticle) {
    blogHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <h4 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">📖 From Our Blog: ${blogArticle.title}</h4>
        <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0;">${blogArticle.description || ''}</p>
        <a href="${FRONTEND_URL}/blog" style="font-size: 13px; font-weight: 700; color: #0FA3B1; text-decoration: none;">Read Full Article →</a>
      </div>
    `;
  }

  const baseBodyHtml = `
    ${title ? `<h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0;">${title}</h2>` : ''}
    ${body ? `<div style="font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 20px;">${body}</div>` : ''}
    ${offersHtml}
    ${productsHtml}
    ${blogHtml}
    <div style="text-align: center; margin-top: 28px;">
      <a href="${FRONTEND_URL}" class="btn-primary">Shop Remise Online</a>
    </div>
  `;

  if (testEmailOnly) {
    const targetEmail = adminEmail || process.env.CONTACT_NOTIFICATION_EMAIL || 'porulontechnologies@gmail.com';
    const html = emailLayout({
      title: subject,
      contentHtml: `<div style="background: #fef08a; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #854d0e; margin-bottom: 16px;">[TEST PREVIEW EMAIL]</div>${baseBodyHtml}`,
      unsubscribeToken: 'test-token',
    });
    await sendMail({ to: targetEmail, subject: `[TEST] ${subject}`, html });
    return { success: true, isTest: true, recipient: targetEmail };
  }

  // Broadcast to all active subscribers
  const subscribers = await getActiveSubscribers();
  if (!subscribers.length) {
    return { success: true, total: 0, message: 'No active subscribers found.' };
  }

  const result = await batchSendEmails({
    recipients: subscribers,
    subject,
    generateHtmlForRecipient: (sub) =>
      emailLayout({
        title: subject,
        contentHtml: baseBodyHtml,
        unsubscribeToken: sub.unsubscribeToken,
      }),
  });

  return { success: true, ...result };
}

/**
 * 7. Send single Offer Notification to active subscribers
 */
async function sendOfferNotification(offer) {
  if (!offer || !offer.title) return;
  const subject = `🔥 New Offer: ${offer.title} on Remise`;
  const discountText = offer.discountPercent ? `${offer.discountPercent}% OFF` : 'Special Discount';

  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        Limited Time Deal
      </span>
      <h2 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 12px 0 6px 0;">${offer.title}</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0;">From ${offer.storeName || 'Verified Remise Store'}</p>
    </div>

    ${offer.image ? `<img src="${offer.image.startsWith('http') ? offer.image : FRONTEND_URL + offer.image}" alt="${offer.title}" style="width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;" />` : ''}

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 12px 0;">${offer.description || 'Exclusive deal available now on the Remise marketplace.'}</p>
      <div style="font-size: 18px; font-weight: 800; color: #0FA3B1;">
        Offer Price: ₹${(offer.offerPrice || 0).toLocaleString('en-IN')} 
        ${offer.originalPrice ? `<span style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 8px;">₹${offer.originalPrice.toLocaleString('en-IN')}</span>` : ''}
        <span style="background: #FF0000; color: #fff; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-left: 8px;">${discountText}</span>
      </div>
      ${offer.validUntil ? `<p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">Valid until: ${new Date(offer.validUntil).toLocaleDateString('en-IN')}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${FRONTEND_URL}/nearby?offer=${offer._id || ''}" class="btn-primary">Claim Offer Now</a>
    </div>
  `;

  const subscribers = await getActiveSubscribers();
  return batchSendEmails({
    recipients: subscribers,
    subject,
    generateHtmlForRecipient: (sub) =>
      emailLayout({
        title: subject,
        contentHtml: bodyHtml,
        unsubscribeToken: sub.unsubscribeToken,
      }),
  });
}

/**
 * 8. Send Blog Article notification to active subscribers
 */
async function sendBlogNotification(article) {
  if (!article || !article.title) return;
  const subject = `📖 New on Remise Blog: ${article.title}`;

  const bodyHtml = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0;">${article.title}</h2>
    ${article.coverImage ? `<img src="${article.coverImage.startsWith('http') ? article.coverImage : FRONTEND_URL + article.coverImage}" alt="${article.title}" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: 12px; margin-bottom: 16px;" />` : ''}
    <p style="font-size: 15px; color: #475569; line-height: 1.6;">${article.description || article.excerpt || ''}</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="${FRONTEND_URL}/blog" class="btn-primary">Read Full Article</a>
    </div>
  `;

  const subscribers = await getActiveSubscribers();
  return batchSendEmails({
    recipients: subscribers,
    subject,
    generateHtmlForRecipient: (sub) =>
      emailLayout({
        title: subject,
        contentHtml: bodyHtml,
        unsubscribeToken: sub.unsubscribeToken,
      }),
  });
}

module.exports = {
  subscribe,
  confirmSubscription,
  unsubscribe,
  getActiveSubscribers,
  sendNewsletterCampaign,
  sendOfferNotification,
  sendBlogNotification,
};
