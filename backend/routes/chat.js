const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');

// Obtener últimos 50 mensajes
router.get('/history', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
