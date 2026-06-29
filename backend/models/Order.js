const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  email:     { type: String, required: true },
  amount:    { type: Number, required: true },
  status:    { type: String, enum: ['pendiente', 'pagado', 'cancelado'], default: 'pendiente' },
  mpRef:     { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
