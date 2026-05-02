'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { matchAPI, conversationAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, Star, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [matchRes, recRes] = await Promise.all([
          matchAPI.findMatches(),
          matchAPI.getRecommendations().catch(() => null),
        ]);
        setMatches(matchRes.data.matches || []);
        if (recRes) setRecommendations(recRes.data);
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const startChat = async (userId) => {
    try {
      const res = await conversationAPI.getOrCreate(userId);
      router.push(`/dashboard/chat/${res.data.conversation._id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const filteredMatches = matches.filter(m =>
    !search || m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.matchedSkills?.canLearn?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Find Your <span className="gradient-text">Perfect Match</span></h1>
        <p className="text-gray-400">AI-powered skill matching finds your ideal exchange partners</p>
      </motion.div>

      {/* Search */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or skill..."
            className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
      </motion.div>

      {/* Trending Skills */}
      {recommendations?.trending?.wanted?.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold">Trending Skills in Demand</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.trending.wanted.slice(0, 8).map((s, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {s._id} ({s.count} want)
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-48 skeleton" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No matches found</h3>
          <p className="text-gray-400 text-sm">Add more skills to your profile to find compatible partners</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match, i) => (
            <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i + 3}
              className="glass-card p-6 hover:border-indigo-500/20 transition-all group">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                  {match.user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{match.user?.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {match.user?.stats?.avgRating?.toFixed(1) || 'New'} · Level {match.user?.stats?.level || 1}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">{Math.round(match.score * 100)}%</div>
                  <div className="text-xs text-gray-500">match</div>
                </div>
              </div>

              {/* Compatibility bars */}
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Skills', value: match.compatibility?.skills || 0, color: 'from-indigo-500 to-purple-500' },
                  { label: 'Level', value: match.compatibility?.level || 0, color: 'from-cyan-500 to-blue-500' },
                  { label: 'Schedule', value: match.compatibility?.availability || 0, color: 'from-emerald-500 to-teal-500' },
                ].map((bar, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">{bar.label}</span>
                    <div className="flex-1 h-1.5 bg-[var(--color-dark-border)] rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${bar.color} rounded-full`} style={{ width: `${bar.value}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{bar.value}%</span>
                  </div>
                ))}
              </div>

              {/* Matched Skills */}
              {match.matchedSkills?.canLearn?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">You can learn:</div>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.canLearn.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {match.matchedSkills?.canTeach?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">You can teach:</div>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.canTeach.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <button onClick={() => startChat(match.user._id)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500/20 transition-colors">
                <MessageCircle className="w-4 h-4" /> Start Chatting
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
