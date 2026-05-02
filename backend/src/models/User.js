const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false, // Don't return password by default
  },
  googleId: { type: String, sparse: true },
  name: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  location: { type: String, default: '' },

  // Skills system
  skillsOffered: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    category: { type: String, default: 'General' },
  }],
  skillsWanted: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    category: { type: String, default: 'General' },
  }],

  // Portfolio
  portfolio: [{
    type: { type: String, enum: ['link', 'video'], default: 'link' },
    url: { type: String, required: true },
    title: { type: String, default: '' },
  }],

  // Availability schedule
  availability: [{
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
    startTime: String, // "09:00"
    endTime: String,   // "17:00"
  }],

  // Gamification stats (computed pattern - updated on events)
  stats: {
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },

  badges: [{ type: String }],

  // Platform
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

// Indexes for efficient queries
userSchema.index({ 'skillsOffered.name': 1 });
userSchema.index({ 'skillsWanted.name': 1 });
userSchema.index({ 'stats.xp': -1 }); // Leaderboard
// email index created automatically by 'unique: true'

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
