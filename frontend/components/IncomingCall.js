'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { Phone, PhoneOff, Video } from 'lucide-react';

/**
 * IncomingCall component - rendered globally to catch incoming calls
 * Place this in the dashboard layout
 */
export default function IncomingCall() {
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, callType }
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('call:incoming', (data) => {
      setIncomingCall(data);
      // Auto-reject after 30 seconds
      setTimeout(() => {
        setIncomingCall(prev => {
          if (prev?.callerId === data.callerId) {
            socket.emit('call:reject', { targetUserId: data.callerId, reason: 'No answer' });
            return null;
          }
          return prev;
        });
      }, 30000);
    });

    socket.on('call:cancelled', () => {
      setIncomingCall(null);
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:cancelled');
    };
  }, []);

  const acceptCall = () => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;

    socket.emit('call:accept', { targetUserId: incomingCall.callerId });
    const callerId = incomingCall.callerId;
    const callerName = incomingCall.callerName;
    setIncomingCall(null);
    router.push(`/dashboard/video/${callerId}?caller=false&name=${encodeURIComponent(callerName)}`);
  };

  const rejectCall = () => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;

    socket.emit('call:reject', { targetUserId: incomingCall.callerId, reason: 'Declined' });
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {/* Pulse ring animation */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full bg-green-500/30"
                />
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white relative z-10">
                  {incomingCall.callerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-white">{incomingCall.callerName}</div>
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  Incoming {incomingCall.callType || 'video'} call...
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={rejectCall}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors">
                <PhoneOff className="w-5 h-5" /> Decline
              </button>
              <button onClick={acceptCall}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-colors">
                <Phone className="w-5 h-5" /> Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
