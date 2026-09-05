const mongoose = require('mongoose');
const crypto = require('crypto');

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address',
      ],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'unconfirmed', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    source: {
      type: String,
      default: 'footer',
    },
    confirmationToken: {
      type: String,
      index: true,
    },
    confirmationTokenExpires: {
      type: Date,
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
    },
    unsubscribedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

newsletterSubscriberSchema.methods.generateConfirmationToken = function () {
  const token = crypto.randomBytes(24).toString('hex');
  this.confirmationToken = token;
  this.confirmationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
};

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
