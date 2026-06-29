const router = require('express').Router();
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Obtener comentarios de un producto
router.get('/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.productId })
      .populate('user', 'username avatar country')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear comentario
router.post('/:productId', protect, async (req, res) => {
  try {
    const { text, rating } = req.body;
    const comment = await Comment.create({
      product: req.params.productId,
      user: req.user._id,
      text,
      rating: rating || 5
    });
    // Actualizar rating promedio del producto
    const all = await Comment.find({ product: req.params.productId });
    const avg = all.reduce((acc, c) => acc + c.rating, 0) / all.length;
    await Product.findByIdAndUpdate(req.params.productId, { rating: avg.toFixed(1), reviews: all.length });
    const populated = await comment.populate('user', 'username avatar country');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a comentario
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const already = comment.likedBy.includes(req.user._id);
    if (already) {
      comment.likedBy.pull(req.user._id);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(req.user._id);
      comment.likes += 1;
    }
    await comment.save();
    res.json({ likes: comment.likes, liked: !already });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar comentario (admin o autor)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'No encontrado' });
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Sin permiso' });
    await comment.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
