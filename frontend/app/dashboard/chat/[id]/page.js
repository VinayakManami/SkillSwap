'use client';
import { useState, useEffect, useRef, use } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { conversationAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Send, Phone, Video, ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChatRoomPage({ params }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const { user, socket: authSocket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const router = useRouter();

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await conversationAPI.getMessages(conversationId);
        setMessages(res.data.messages || []);

        // Get conversations to find other participant
        const convRes = await conversationAPI.getAll();
        const conv = convRes.data.conversations?.find(c => c._id === conversationId);
        if (conv) {
          const other = conv.participants?.find(p => p._id !== user?._id);
          setOtherUser(other);
        }
      } catch (err) {
        console.error('Error fetching chat:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [conversationId, user]);

  // Socket.io events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat:join', conversationId);

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chat:typing', ({ userId, isTyping }) => {
      if (userId !== user?._id) setTyping(isTyping);
    });

    return () => {
      socket.emit('chat:leave', conversationId);
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [conversationId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat:message', {
      conversationId,
      content: newMessage.trim(),
      type: 'text',
    });
    setNewMessage('');
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat:typing', { conversationId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { conversationId, isTyping: false });
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="glass-card !rounded-b-none p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/chat" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
            {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold">{otherUser?.name || 'Loading...'}</div>
            <div className="text-xs text-gray-500">
              {typing ? <span className="text-indigo-400">typing...</span> : otherUser?.isOnline ? <span className="text-green-400">Online</span> : 'Offline'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => otherUser?._id && router.push(`/dashboard/video/${otherUser._id}?caller=true&name=${encodeURIComponent(otherUser.name)}`)}
            className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Audio call">
            <Phone className="w-5 h-5" />
          </button>
          <button onClick={() => otherUser?._id && router.push(`/dashboard/video/${otherUser._id}?caller=true&name=${encodeURIComponent(otherUser.name)}`)}
            className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Video call">
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-dark-bg)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <p>Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const rawSender = msg.senderId || msg.sender || msg.sender_id;
            const senderIdStr = rawSender?._id || rawSender?.id || (typeof rawSender === 'string' ? rawSender : null);
            const currentUserId = user?._id || user?.id;
            const isMine = senderIdStr && currentUserId && String(senderIdStr).toLowerCase() === String(currentUserId).toLowerCase();
            return (
              <motion.div key={msg._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-md'
                    : 'bg-[var(--color-dark-card)] text-gray-200 rounded-bl-md'
                }`}>
                  <p>{msg.content}</p>
                  <div className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[var(--color-dark-surface)] border-t border-[var(--color-dark-border)]">
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..."
            className="flex-1 bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
          <button onClick={sendMessage} disabled={!newMessage.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 transition-opacity disabled:opacity-30">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
