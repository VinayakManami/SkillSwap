'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { sessionAPI, matchAPI } from '@/lib/api';
import { Users, Calendar, Star, Zap, TrendingUp, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, matchRes] = await Promise.all([
          sessionAPI.getSessions({}).catch(() => ({ data: { sessions: [] } })),
          matchAPI.findMatches().catch(() => ({ data: { matches: [] } })),
        ]);
        setSessions(sessRes.data.sessions || []);
        setMatches(matchRes.data.matches || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { icon: Calendar, label: 'Sessions', value: user?.stats?.sessionsCompleted || 0, color: 'from-indigo-500 to-purple-500', change: '+3 this week' },
    { icon: Star, label: 'Avg Rating', value: user?.stats?.avgRating?.toFixed(1) || '0.0', color: 'from-amber-500 to-orange-500', change: `${user?.stats?.reviewCount || 0} reviews` },
    { icon: Zap, label: 'XP Points', value: user?.stats?.xp || 0, color: 'from-cyan-500 to-blue-500', change: `Level ${user?.stats?.level || 1}` },
    { icon: Users, label: 'Matches', value: matches.length, color: 'from-emerald-500 to-teal-500', change: 'Active now' },
  ];

  // Calculate XP progress to next level
  const currentXP = user?.stats?.xp || 0;
  const currentLevel = user?.stats?.level || 1;
  const xpForNextLevel = currentLevel * 500;
  const xpProgress = Math.min((currentXP % 500) / 500 * 100, 100);

  return (
    <div>
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋</h1>
        <p className="text-gray-400">Here&apos;s your skill exchange overview</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
            className="glass-card p-5 group hover:border-indigo-500/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Level Progress */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
          className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Level Progress</h2>
            <span className="text-sm text-indigo-400">Level {currentLevel}</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">{currentXP} XP</span>
                <span className="text-gray-500">{xpForNextLevel} XP needed</span>
              </div>
              <div className="h-3 bg-[var(--color-dark-border)] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Badges Earned</h3>
            <div className="flex gap-2 flex-wrap">
              {(user?.badges?.length ? user.badges : ['Newcomer']).map((badge, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  🏆 {badge}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
          className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/matches" className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-dark-surface)] hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="text-sm">Find Matches</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
            </Link>
            <Link href="/dashboard/profile" className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-dark-surface)] hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="text-sm">Update Skills</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </Link>
            <Link href="/dashboard/chat" className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-dark-surface)] hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">View Sessions</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Top Matches Preview */}
      {matches.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} className="glass-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Matches</h2>
            <Link href="/dashboard/matches" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, 3).map((match, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                    {match.user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{match.user?.name}</div>
                    <div className="text-xs text-gray-500">{Math.round(match.score * 100)}% match</div>
                  </div>
                </div>
                {match.matchedSkills?.canLearn?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.canLearn.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
