const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user:      { type: String, required: true },
  avatar:    { type: String, default: '' },
  text:      { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatSchema);
