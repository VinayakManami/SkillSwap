const supabase = require('../config/supabase');

/**
 * Chat event handlers for Socket.io
 * Messages are persisted to Supabase
 */
module.exports = (io, socket) => {
  // Join conversation room
  socket.on('chat:join', (conversationId) => {
    socket.join(`chat:${conversationId}`);
    console.log(`💬 ${socket.user.name} joined chat ${conversationId}`);
  });

  // Leave conversation room
  socket.on('chat:leave', (conversationId) => {
    socket.leave(`chat:${conversationId}`);
  });

  // Send message
  socket.on('chat:message', async (data) => {
    try {
      const { conversationId, content, type = 'text', fileUrl } = data;

      // Save message to Supabase
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: socket.userId,
          content,
          type,
          file_url: fileUrl || '',
          read_by: [socket.userId],
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message_content: type === 'file' ? '📎 File' : content,
          last_message_sender_id: socket.userId,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Format for frontend
      const formattedMessage = {
        _id: message.id,
        conversationId: message.conversation_id,
        senderId: { _id: socket.userId, name: socket.user.name, avatar: socket.user.avatar || '' },
        content: message.content,
        type: message.type,
        fileUrl: message.file_url,
        readBy: message.read_by,
        createdAt: message.created_at,
      };

      // Broadcast to conversation room
      io.to(`chat:${conversationId}`).emit('chat:message', formattedMessage);

      // Send notification to participants not in the room
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single();

      if (conv) {
        conv.participant_ids.forEach(participantId => {
          if (participantId !== socket.userId) {
            io.to(participantId).emit('notification:new', {
              type: 'message',
              title: `New message from ${socket.user.name}`,
              body: content.substring(0, 100),
              data: { conversationId },
            });
          }
        });
      }
    } catch (err) {
      console.error('Chat message error:', err);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ conversationId, isTyping }) => {
    socket.to(`chat:${conversationId}`).emit('chat:typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping,
    });
  });

  // Mark messages as read
  socket.on('chat:read', async ({ conversationId }) => {
    try {
      // Get unread messages in this conversation
      const { data: unread } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('conversation_id', conversationId)
        .neq('sender_id', socket.userId);

      if (unread) {
        for (const msg of unread) {
          const readBy = msg.read_by || [];
          if (!readBy.includes(socket.userId)) {
            readBy.push(socket.userId);
            await supabase.from('messages').update({ read_by: readBy }).eq('id', msg.id);
          }
        }
      }

      socket.to(`chat:${conversationId}`).emit('chat:read', { userId: socket.userId });
    } catch (err) {
      console.error('Read receipt error:', err);
    }
  });
};
