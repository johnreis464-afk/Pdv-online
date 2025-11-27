const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, trim: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 }
});

const SaleSchema = new mongoose.Schema({
  items: [SaleItemSchema],
  total: { type: Number, required: true, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  saleNumber: { type: Number, required: true, index: true },
  customerChange: { type: Number, default: 0 },
  status: { type: String, enum: ['completed','pending','cancelled'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

SaleSchema.pre('validate', async function(next) {
  // Ensure saleNumber is present (simple auto increment based on timestamp fallback)
  if (!this.saleNumber) {
    this.saleNumber = Math.floor(Date.now() / 1000);
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);
