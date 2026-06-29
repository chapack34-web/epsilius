require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: process.env.JWT_SECRET || 'epsilius_secret',
  resave: false,
  saveUninitialized: false
}));

// ── Base de datos ───────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epsilius')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// ── Rutas ───────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/orders',   require('./routes/orders'));

// ── Servir frontend para todas las rutas ────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Socket.io - Chat en tiempo real ─────────────────────
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  socket.on('join', (userData) => {
    onlineUsers.set(socket.id, userData);
    io.emit('online_count', onlineUsers.size);
  });

  socket.on('send_message', async (msg) => {
    const ChatMessage = require('./models/ChatMessage');
    const saved = await ChatMessage.create({
      user: msg.user,
      avatar: msg.avatar,
      text: msg.text,
      timestamp: new Date()
    });
    io.emit('receive_message', saved);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online_count', onlineUsers.size);
  });
});

// ── Iniciar servidor ─────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 EPSILIUS corriendo en http://localhost:${PORT}`);
});
