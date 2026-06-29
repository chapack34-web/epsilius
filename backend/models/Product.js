const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true },
  category:    { type: String, enum: ['programa', 'extension', 'archivo', 'herramienta', 'otro'], default: 'otro' },
  fileUrl:     { type: String, default: '' },        // archivo subido
  imageUrl:    { type: String, default: '' },        // imagen del producto
  downloadUrl: { type: String, default: '' },        // link externo opcional
  mpLink:      { type: String, default: 'https://mpago.la/mateo.romero915' },
  tags:        [String],
  version:     { type: String, default: '1.0' },
  featured:    { type: Boolean, default: false },
  downloads:   { type: Number, default: 0 },
  rating:      { type: Number, default: 0 },
  reviews:     { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
