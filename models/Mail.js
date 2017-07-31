const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
  email: {
      to: String,
      from: String,
      subject: String,
      text: String,
      html: String
  }
}, { timestamps: true });

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;
