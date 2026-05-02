'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { conversationAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Search } from 'lucide-react';

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await conversationAPI.getAll();
        setConversations(res.data.conversations || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p._id !== user?._id) || {};
  };

  const filtered = conversations.filter(c => {
    const other = getOtherParticipant(c);
    return !search || other.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Messages</h1>
        <p className="text-gray-400 text-sm">Chat with your skill exchange partners</p>
      </motion.div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
          className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass-card p-4 h-20 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-gray-400 text-sm">Find a match and start chatting!</p>
          <Link href="/dashboard/matches" className="inline-block mt-4 text-indigo-400 text-sm hover:text-indigo-300">Find Matches →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv, i) => {
            const other = getOtherParticipant(conv);
            return (
              <Link key={conv._id} href={`/dashboard/chat/${conv._id}`}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/20 transition-all cursor-pointer">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                      {other.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {other.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--color-dark-surface)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{other.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</div>
                  </div>
                  {conv.lastMessage?.createdAt && (
                    <div className="text-xs text-gray-500">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
