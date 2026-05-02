const jwt = require('jsonwebtoken');
const config = require('../config/env');
const supabase = require('../config/supabase');
const chatHandler = require('./chatHandler');
const signalingHandler = require('./signalingHandler');

/**
 * Initialize Socket.io with authentication and event handlers
 */
module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, config.jwtSecret);

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, avatar, email')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) return next(new Error('User not found'));

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);

    // Update online status
    await supabase.from('users').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', socket.userId);

    // Join personal room for notifications
    socket.join(socket.userId);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Register event handlers
    chatHandler(io, socket);
    signalingHandler(io, socket);

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);
      await supabase.from('users').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', socket.userId);
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });
};
