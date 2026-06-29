const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Configuración Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Permitir cualquier tipo de archivo
    cb(null, true);
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    if (featured) filter.featured = true;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un producto
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'No encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear producto (solo admin)
router.post('/', protect, adminOnly, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.file) data.fileUrl = '/uploads/' + req.files.file[0].filename;
    if (req.files?.image) data.imageUrl = '/uploads/' + req.files.image[0].filename;
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    const product = await Product.create(data);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar producto (solo admin)
router.put('/:id', protect, adminOnly, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.file) data.fileUrl = '/uploads/' + req.files.file[0].filename;
    if (req.files?.image) data.imageUrl = '/uploads/' + req.files.image[0].filename;
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar producto (solo admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
