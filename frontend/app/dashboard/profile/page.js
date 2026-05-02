'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import { Save, Plus, X, BookOpen, GraduationCap, Link as LinkIcon } from 'lucide-react';

const CATEGORIES = ['Programming', 'Design', 'Music', 'Languages', 'Cooking', 'Marketing', 'Photography', 'Writing', 'Fitness', 'Finance', 'Data Science', 'AI/ML', 'Business', 'General'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skillsOffered, setSkillsOffered] = useState(user?.skillsOffered || []);
  const [skillsWanted, setSkillsWanted] = useState(user?.skillsWanted || []);
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');
  const [offeredLevel, setOfferedLevel] = useState('intermediate');
  const [wantedLevel, setWantedLevel] = useState('beginner');
  const [offeredCategory, setOfferedCategory] = useState('General');
  const [wantedCategory, setWantedCategory] = useState('General');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addSkillOffered = () => {
    if (!newSkillOffered.trim()) return;
    setSkillsOffered([...skillsOffered, { name: newSkillOffered.trim(), level: offeredLevel, category: offeredCategory }]);
    setNewSkillOffered('');
  };

  const addSkillWanted = () => {
    if (!newSkillWanted.trim()) return;
    setSkillsWanted([...skillsWanted, { name: newSkillWanted.trim(), level: wantedLevel, category: wantedCategory }]);
    setNewSkillWanted('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ name, bio, location, skillsOffered, skillsWanted });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const levelColors = { beginner: 'text-green-400 bg-green-500/10', intermediate: 'text-amber-400 bg-amber-500/10', advanced: 'text-red-400 bg-red-500/10' };

  return (
    <div className="max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your skills and preferences</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country"
                className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500} placeholder="Tell others about yourself..."
                className="w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              <div className="text-xs text-gray-500 text-right mt-1">{bio.length}/500</div>
            </div>
          </div>
        </div>

        {/* Skills I Can Teach */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold">Skills I Can Teach</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {skillsOffered.map((skill, i) => (
              <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm">
                {skill.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${levelColors[skill.level]}`}>{skill.level}</span>
                <button onClick={() => setSkillsOffered(skillsOffered.filter((_, j) => j !== i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="text" value={newSkillOffered} onChange={e => setNewSkillOffered(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkillOffered()} placeholder="Add a skill..."
              className="flex-1 min-w-[200px] bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            <select value={offeredLevel} onChange={e => setOfferedLevel(e.target.value)}
              className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={offeredCategory} onChange={e => setOfferedCategory(e.target.value)}
              className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addSkillOffered} className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl hover:bg-indigo-500/30 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skills I Want to Learn */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Skills I Want to Learn</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {skillsWanted.map((skill, i) => (
              <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm">
                {skill.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${levelColors[skill.level]}`}>{skill.level}</span>
                <button onClick={() => setSkillsWanted(skillsWanted.filter((_, j) => j !== i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="text" value={newSkillWanted} onChange={e => setNewSkillWanted(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkillWanted()} placeholder="Add a skill..."
              className="flex-1 min-w-[200px] bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-500" />
            <select value={wantedLevel} onChange={e => setWantedLevel(e.target.value)}
              className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={wantedCategory} onChange={e => setWantedCategory(e.target.value)}
              className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addSkillWanted} className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl hover:bg-cyan-500/30 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
