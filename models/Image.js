const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  filename: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, trim: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', ImageSchema);
