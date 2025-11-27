const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  barcode: { type: String, trim: true, required: true, index: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, default: 0 },
  category: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
