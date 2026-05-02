const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const matchRoutes = require('./routes/matches');
const conversationRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'supabase', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Setup Socket.io
setupSocket(io);

// Start server (no MongoDB connection needed — Supabase is serverless)
server.listen(config.port, () => {
  console.log(`
    ╔═══════════════════════════════════════════╗
    ║       🚀 SkillSwap API Server             ║
    ║       Port: ${config.port}                         ║
    ║       Env: ${config.nodeEnv}                  ║
    ║       DB: Supabase (PostgreSQL)           ║
    ║       API: http://localhost:${config.port}/api     ║
    ╚═══════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
