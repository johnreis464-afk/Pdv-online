const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Product = require('./models/Product');
const Sale = require('./models/Sale');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// Conexão com MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdv-system';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado ao MongoDB'))
.catch(err => console.error('❌ Erro MongoDB:', err));

// Rotas da API

// Buscar produto por código de barras
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      barcode: req.params.barcode,
      active: true 
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({
      success: true,
      product: {
        id: product._id,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor',
      error: error.message 
    });
  }
});

// Listar todos os produtos
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .sort({ name: 1 });
    
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar produtos',
      error: error.message 
    });
  }
});

// Criar nova venda
app.post('/api/sales', async (req, res) => {
  try {
    const { items, total, paymentMethod, customerChange } = req.body;
    
    // Validar estoque antes de criar a venda
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produto ${item.productName} não encontrado`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para ${item.productName}. Disponível: ${product.stock}`
        });
      }
    }
    
    // Criar venda
    const sale = new Sale({
      items,
      total,
      paymentMethod,
      customerChange: customerChange || 0
    });
    
    await sale.save();
    
    // Atualizar estoque
    for (let item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    res.json({
      success: true,
      message: 'Venda registrada com sucesso',
      sale: {
        id: sale._id,
        saleNumber: sale.saleNumber,
        total: sale.total,
        createdAt: sale.createdAt
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar venda',
      error: error.message
    });
  }
});

// Listar vendas
app.get('/api/sales', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('items.product', 'name barcode');
    
    const total = await Sale.countDocuments();
    
    res.json({
      success: true,
      sales,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vendas',
      error: error.message
    });
  }
});

// Relatórios
app.get('/api/reports/daily', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalSales: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalSales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      report: {
        date: today,
        byPaymentMethod: sales,
        total: totalSales[0] || { total: 0, count: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error.message
    });
  }
});

// Inserir produtos de exemplo
app.post('/api/seed-products', async (req, res) => {
  try {
    const sampleProducts = [
      {
        barcode: '7891234567890',
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 Litros',
        price: 8.50,
        stock: 50,
        category: 'Bebidas'
      },
      {
        barcode: '7891234567891',
        name: 'Pão Francês',
        description: 'Pão francês unidade',
        price: 0.50,
        stock: 100,
        category: 'Padaria'
      },
      {
        barcode: '7891234567892',
        name: 'Arroz 5kg',
        description: 'Arroz tipo 1 5kg',
        price: 22.90,
        stock: 30,
        category: 'Mercearia'
      },
      {
        barcode: '7891234567893',
        name: 'Feijão 1kg',
        description: 'Feijão carioca 1kg',
        price: 7.80,
        stock: 40,
        category: 'Mercearia'
      },
      {
        barcode: '7891234567894',
        name: 'Leite 1L',
        description: 'Leite integral 1 litro',
        price: 4.20,
        stock: 60,
        category: 'Laticínios'
      },
      {
        barcode: '7891234567895',
        name: 'Açúcar 1kg',
        description: 'Açúcar refinado 1kg',
        price: 3.90,
        stock: 25,
        category: 'Mercearia'
      }
    ];
    
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    
    res.json({
      success: true,
      message: 'Produtos de exemplo inseridos com sucesso',
      count: sampleProducts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao inserir produtos',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API PDV funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Acesse: http://localhost:${PORT}`);
});