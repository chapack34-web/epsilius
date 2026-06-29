const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'epsilius_secret', { expiresIn: '30d' });

// Registro
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, country } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Completá todos los campos' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Email o usuario ya registrado' });

    // El gmail de admin obtiene rol admin automáticamente
    const role = email === 'epsiliusoficial@gmail.com' ? 'admin' : 'user';
    const user = await User.create({ username, email, password, country, role });
    res.json({ token: sign(user._id), user: { id: user._id, username, email, role, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    res.json({ token: sign(user._id), user: { id: user._id, username: user.username, email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Perfil actual
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// Actualizar perfil
router.put('/me', protect, async (req, res) => {
  try {
    const { bio, country, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { bio, country, avatar }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
