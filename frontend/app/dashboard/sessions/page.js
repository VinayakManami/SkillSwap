'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sessionAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, Play, Star } from 'lucide-react';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const params = filter !== 'all' ? { status: filter } : {};
        const res = await sessionAPI.getSessions(params);
        setSessions(res.data.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await sessionAPI.updateStatus(id, status);
      setSessions(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    } catch (err) {
      alert('Failed to update session');
    }
  };

  const submitReview = async () => {
    try {
      await sessionAPI.createReview(reviewModal, { rating, comment });
      setReviewModal(null);
      setRating(5);
      setComment('');
      alert('Review submitted!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const statusColors = {
    scheduled: 'text-blue-400 bg-blue-500/10',
    active: 'text-green-400 bg-green-500/10',
    completed: 'text-gray-400 bg-gray-500/10',
    cancelled: 'text-red-400 bg-red-500/10',
  };

  const filters = ['all', 'scheduled', 'active', 'completed', 'cancelled'];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Sessions</h1>
        <p className="text-gray-400 text-sm">Manage your skill exchange sessions</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-6 h-32 skeleton" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
          <p className="text-gray-400 text-sm">Schedule a session with a match to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => {
            const otherUser = session.participants?.find(p => p._id !== user?._id);
            return (
              <motion.div key={session._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                      {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{otherUser?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">
                        Teaching: {session.skillExchanged?.teaching} · Learning: {session.skillExchanged?.learning}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {session.duration} min</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {session.status === 'scheduled' && (
                    <>
                      <button onClick={() => updateStatus(session._id, 'active')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm hover:bg-green-500/20">
                        <Play className="w-3 h-3" /> Start
                      </button>
                      <button onClick={() => updateStatus(session._id, 'cancelled')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </>
                  )}
                  {session.status === 'active' && (
                    <button onClick={() => updateStatus(session._id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm hover:bg-blue-500/20">
                      <CheckCircle className="w-3 h-3" /> Complete
                    </button>
                  )}
                  {session.status === 'completed' && (
                    <button onClick={() => setReviewModal(session._id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/20">
                      <Star className="w-3 h-3" /> Leave Review
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReviewModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How was your experience?"
              className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none mb-4" rows={3} />
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={submitReview} className="flex-1 py-2.5 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium">Submit</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
