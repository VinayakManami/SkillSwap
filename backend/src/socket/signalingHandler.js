/**
 * WebRTC Signaling Handler
 * Manages SDP offer/answer exchange and ICE candidate forwarding
 */
module.exports = (io, socket) => {
  // Initiate a call
  socket.on('call:initiate', ({ targetUserId, sessionId, callType }) => {
    console.log(`📞 ${socket.user.name} calling ${targetUserId} (${callType})`);
    io.to(targetUserId).emit('call:incoming', {
      callerId: socket.userId,
      callerName: socket.user.name,
      callerAvatar: socket.user.avatar,
      sessionId,
      callType, // 'video' | 'audio' | 'screen'
    });
  });

  // Accept a call
  socket.on('call:accept', ({ targetUserId }) => {
    const roomId = `call:${[socket.userId, targetUserId].sort().join('-')}`;
    socket.join(roomId);
    io.to(targetUserId).emit('call:accepted', {
      userId: socket.userId,
      roomId,
    });
    // Caller also joins the room
    const callerSockets = io.sockets.adapter.rooms.get(targetUserId);
    if (callerSockets) {
      callerSockets.forEach(socketId => {
        io.sockets.sockets.get(socketId)?.join(roomId);
      });
    }
  });

  // Reject a call
  socket.on('call:reject', ({ targetUserId, reason }) => {
    io.to(targetUserId).emit('call:rejected', {
      rejecterId: socket.userId,
      reason: reason || 'Call declined',
    });
  });

  // End a call
  socket.on('call:end', ({ roomId, targetUserId }) => {
    if (roomId) {
      socket.to(roomId).emit('call:ended', { userId: socket.userId });
      socket.leave(roomId);
    }
    if (targetUserId) {
      io.to(targetUserId).emit('call:ended', { userId: socket.userId });
    }
  });

  // WebRTC SDP Offer
  socket.on('webrtc:offer', ({ targetUserId, offer, roomId }) => {
    io.to(targetUserId).emit('webrtc:offer', {
      offer,
      callerId: socket.userId,
      roomId,
    });
  });

  // WebRTC SDP Answer
  socket.on('webrtc:answer', ({ targetUserId, answer, roomId }) => {
    io.to(targetUserId).emit('webrtc:answer', {
      answer,
      answererId: socket.userId,
      roomId,
    });
  });

  // ICE Candidate exchange
  socket.on('webrtc:ice-candidate', ({ targetUserId, candidate, roomId }) => {
    io.to(targetUserId).emit('webrtc:ice-candidate', {
      candidate,
      userId: socket.userId,
    });
  });

  // Toggle screen sharing
  socket.on('call:screen-share', ({ roomId, isSharing }) => {
    socket.to(roomId).emit('call:screen-share', {
      userId: socket.userId,
      isSharing,
    });
  });
};
