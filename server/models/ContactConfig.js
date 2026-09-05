const mongoose = require('mongoose');

const contactConfigSchema = new mongoose.Schema({
  title: { type: String, default: "Get in Touch" },
  subtitle: { type: String, default: "We'd love to hear from you. Contact us for any queries." },
  email: { type: String, default: "porulontechnologies@gmail.com" },
  phone: { type: String, default: "+91 90470 099277" },
  address: { type: String, default: "Coimbatore, Tamil Nadu, India" },
  hoursWeekday: { type: String, default: "9:00 AM - 8:00 PM" },
  hoursSaturday: { type: String, default: "10:00 AM - 6:00 PM" },
  hoursSunday: { type: String, default: "Closed" }
}, { timestamps: true });

const defaultContact = {
  title: "Get in Touch",
  subtitle: "We'd love to hear from you. Contact us for any queries.",
  email: "porulontechnologies@gmail.com",
  phone: "+91 90470 099277",
  address: "Coimbatore, Tamil Nadu, India",
  hoursWeekday: "9:00 AM - 8:00 PM",
  hoursSaturday: "10:00 AM - 6:00 PM",
  hoursSunday: "Closed"
};

contactConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create(defaultContact);
  } else {
    let modified = false;
    if (!config.email || config.email.includes('wowlifestyle.com')) { config.email = defaultContact.email; modified = true; }
    if (!config.phone || config.phone.includes('98765 43210')) { config.phone = defaultContact.phone; modified = true; }
    if (!config.address || config.address.includes('Lifestyle Street')) { config.address = defaultContact.address; modified = true; }
    if (!config.title) { config.title = defaultContact.title; modified = true; }
    if (!config.subtitle) { config.subtitle = defaultContact.subtitle; modified = true; }
    if (!config.hoursWeekday) { config.hoursWeekday = defaultContact.hoursWeekday; modified = true; }
    if (!config.hoursSaturday) { config.hoursSaturday = defaultContact.hoursSaturday; modified = true; }
    if (!config.hoursSunday) { config.hoursSunday = defaultContact.hoursSunday; modified = true; }
    if (modified) await config.save();
  }
  return config;
};

contactConfigSchema.statics.resetConfig = async function() {
  let config = await this.findOne();
  if (config) {
    Object.assign(config, defaultContact);
    await config.save();
  } else {
    config = await this.create(defaultContact);
  }
  return config;
};

module.exports = mongoose.model('ContactConfig', contactConfigSchema);