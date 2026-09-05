const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 */
async function sendMail({ to, subject, html }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [Email] RESEND_API_KEY not configured — email skipped.');
      return { skipped: true };
    }
    const from = process.env.RESEND_FROM_EMAIL || 'Porulon Technologies <info@porulontech.com>';
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error('❌ [Email Service Error]:', error.message || error);
    throw error;
  }
}

/**
 * Send contact notification to Admin/Support (porulontechnologies@gmail.com)
 */
async function sendContactFormEmail({ name, email, phone, message }) {
  const targetEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'porulontechnologies@gmail.com';
  const receivedTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
        .content { padding: 24px; color: #1e293b; }
        .badge { display: inline-block; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #fecaca; }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 500; color: #0f172a; word-break: break-word; }
        .message-box { background: #f8fafc; border-left: 4px solid #f97316; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 12px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <span class="badge">Remise Contact Inquiry</span>
          <div class="field">
            <div class="label">Sender Name</div>
            <div class="value">${name || 'Not specified'}</div>
          </div>
          <div class="field">
            <div class="label">Email Address</div>
            <div class="value"><a href="mailto:${email}" style="color: #ea580c; text-decoration: none; font-weight: 600;">${email}</a></div>
          </div>
          <div class="field">
            <div class="label">Phone Number</div>
            <div class="value">${phone ? `<a href="tel:${phone}" style="color: #0f172a; text-decoration: none;">${phone}</a>` : 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="label">Received At</div>
            <div class="value">${receivedTime} IST</div>
          </div>
          <div class="field">
            <div class="label">Message</div>
            <div class="message-box">${message}</div>
          </div>
        </div>
        <div class="footer">
          Received via Remise Contact Form · Porulon Technologies
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to: targetEmail,
    subject: `[Remise Contact] Message from ${name} (${email})`,
    html,
  });
}

module.exports = {
  sendMail,
  sendContactFormEmail,
};
