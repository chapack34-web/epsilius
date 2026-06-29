const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Crear orden (al hacer clic en comprar)
router.post('/', async (req, res) => {
  try {
    const { productId, email, userId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const order = await Order.create({
      user: userId || null,
      product: productId,
      email,
      amount: product.price
    });

    // Link de pago Mercado Pago
    const mpLink = `https://mpago.la/${process.env.MP_USER || 'mateo.romero915'}`;

    res.json({ order, mpLink, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar pago (admin)
router.put('/:id/confirm', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'pagado' }, { new: true })
      .populate('product').populate('user', 'username email');
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ver todas las órdenes (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('product', 'title price').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
