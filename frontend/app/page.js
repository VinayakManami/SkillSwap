'use client';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Zap, Users, Video, Star, Shield, BarChart3, MessageCircle, Globe, Award } from 'lucide-react';

// Dynamic import for Three.js (no SSR)
const Hero3D = dynamic(() => import('@/components/landing/Hero3D'), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

const features = [
  { icon: Users, title: 'Smart Matching', desc: 'AI-powered algorithm finds your perfect skill exchange partner based on compatibility.', color: 'from-indigo-500 to-purple-500' },
  { icon: Video, title: 'Video Sessions', desc: 'HD video calls with screen sharing for immersive learning experiences.', color: 'from-cyan-500 to-blue-500' },
  { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Instant messaging with typing indicators, file sharing, and read receipts.', color: 'from-emerald-500 to-teal-500' },
  { icon: Star, title: 'Trust System', desc: 'Ratings, reviews, and verification badges build community trust.', color: 'from-amber-500 to-orange-500' },
  { icon: Award, title: 'Gamification', desc: 'Earn XP, unlock badges, and climb the leaderboard as you learn and teach.', color: 'from-pink-500 to-rose-500' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT authentication, role-based access, and end-to-end encrypted messaging.', color: 'from-violet-500 to-indigo-500' },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '500+', label: 'Skills Listed' },
  { value: '25K+', label: 'Sessions Completed' },
  { value: '4.9★', label: 'Avg Rating' },
];

const skillCategories = ['Programming', 'Design', 'Music', 'Languages', 'Cooking', 'Marketing', 'Photography', 'Writing', 'Fitness', 'Finance', 'Data Science', 'AI/ML'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-dark-bg)] overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-card !rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SkillSwap</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#skills" className="text-sm text-gray-400 hover:text-white transition-colors">Skills</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <Suspense fallback={<div className="absolute inset-0 animated-gradient" />}>
          <Hero3D />
        </Suspense>
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
              🚀 The Future of Peer Learning
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Exchange Skills,
            <br />
            <span className="gradient-text">Grow Together</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Teach what you know. Learn what you love. SkillSwap connects you with people who have the skills you need — and need the skills you have.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:opacity-90 transition-all glow-primary">
              Start Swapping
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 glass-card px-8 py-3.5 rounded-full text-lg font-semibold text-gray-300 hover:text-white transition-colors">
              How It Works
            </a>
          </motion.div>
        </div>
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-dark-bg)] to-transparent" />
      </section>

      {/* Stats */}
      <section className="py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="glass-card p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need to <span className="gradient-text">Learn & Teach</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Powerful features designed to make skill exchange seamless, engaging, and rewarding.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card p-8 group hover:border-indigo-500/30 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It <span className="gradient-text">Works</span></h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'List the skills you can teach and the ones you want to learn. Add your availability and portfolio.' },
              { step: '02', title: 'Find Your Match', desc: 'Our AI matching algorithm finds users with complementary skills for a perfect mutual exchange.' },
              { step: '03', title: 'Start Learning', desc: 'Schedule sessions, connect via video call, chat in real-time, and grow your skills together.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="text-center">
                <div className="text-6xl font-bold gradient-text mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Showcase */}
      <section id="skills" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Popular <span className="gradient-text">Skills</span></h2>
            <p className="text-gray-400">Explore hundreds of skills available for exchange</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="flex flex-wrap justify-center gap-3">
            {skillCategories.map((skill, i) => (
              <span key={i} className="glass-card px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-indigo-500/30 cursor-pointer transition-all">
                {skill}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card p-12 md:p-16 text-center glow-primary">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your <span className="gradient-text">Skill Journey</span>?</h2>
            <p className="text-gray-400 mb-8 text-lg">Join thousands of learners and teachers exchanging skills every day.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:opacity-90 transition-all">
              Join SkillSwap Free <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-dark-border)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">SkillSwap</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-500">© 2026 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
