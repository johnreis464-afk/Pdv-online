require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Sale = require('../models/Sale');
const Image = require('../models/Image');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdv-system';

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB for seeding');

  // Clear
  await Product.deleteMany({});
  await Client.deleteMany({});
  await Sale.deleteMany({});
  await Image.deleteMany({});

  // Insert sample products
  const products = await Product.insertMany([
    { barcode: '7891234567890', name: 'Coca-Cola 2L', description: 'Refrigerante', price: 8.50, stock: 50, category: 'Bebidas' },
    { barcode: '7891234567891', name: 'Pão Francês', description: 'Pão francês', price: 0.5, stock: 100, category: 'Padaria' },
    { barcode: '7891234567892', name: 'Arroz 5kg', description: 'Arroz 5kg', price: 22.9, stock: 30, category: 'Mercearia' }
  ]);

  // Insert sample clients
  const clients = await Client.insertMany([
    { name: 'João Silva', email: 'joao@example.com', phone: '11987654321' },
    { name: 'Maria Souza', email: 'maria@example.com', phone: '11912345678' }
  ]);

  // Sample sale
  const sale = new Sale({
    items: [{ product: products[0]._id, productName: products[0].name, quantity: 2, unitPrice: products[0].price }],
    total: products[0].price * 2,
    paymentMethod: 'cash'
  });
  await sale.save();

  // Update client purchases
  clients[0].purchases.push(sale._id);
  clients[0].totalSpent += sale.total;
  await clients[0].save();

  // Insert image metadata
  await Image.create({ filename: 'logo.png', url: 'https://raw.githubusercontent.com/johnreis464-afk/Pdv-online/main/img/logo.png', mimeType: 'image/png' });

  console.log('Seed complete');
  mongoose.disconnect();
}

run().catch(err => { console.error(err); mongoose.disconnect(); process.exit(1); });
