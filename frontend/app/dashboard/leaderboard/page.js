'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Medal, Star, Zap, Crown } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await userAPI.getLeaderboard();
        setLeaderboard(res.data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-amber-400" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank + 1}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 0) return 'border-amber-500/30 bg-amber-500/5';
    if (rank === 1) return 'border-gray-400/30 bg-gray-400/5';
    if (rank === 2) return 'border-amber-600/30 bg-amber-600/5';
    return '';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Leaderboard</span></h1>
        <p className="text-gray-400 text-sm">Top skill exchangers on the platform</p>
      </motion.div>

      {/* Current user rank card */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6 glow-primary">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg">{user.name} (You)</div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-0.5">
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-cyan-400" /> {user.stats?.xp || 0} XP</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" /> Level {user.stats?.level || 1}</span>
                <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-indigo-400" /> {user.stats?.sessionsCompleted || 0} sessions</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <div key={i} className="glass-card p-5 h-16 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <motion.div key={entry._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 flex items-center gap-4 ${getRankBg(i)} ${entry._id === user?._id ? 'ring-1 ring-indigo-500/30' : ''}`}>
              <div className="w-8 text-center">{getRankIcon(i)}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                {entry.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{entry.name} {entry._id === user?._id && <span className="text-indigo-400">(You)</span>}</div>
                <div className="text-xs text-gray-500">Level {entry.stats?.level || 1} · {entry.stats?.sessionsCompleted || 0} sessions</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold gradient-text">{entry.stats?.xp || 0}</div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
              {entry.badges?.length > 0 && (
                <div className="hidden md:flex gap-1">
                  {entry.badges.slice(0, 3).map((b, j) => (
                    <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-400">🏆</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
