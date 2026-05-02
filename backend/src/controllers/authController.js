const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .select('id, email, name, avatar, bio, location, skills_offered, skills_wanted, portfolio, availability, avg_rating, review_count, sessions_completed, xp, level, badges, role, is_verified, created_at')
      .single();

    if (error) throw error;

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    // Update online status
    await supabase
      .from('users')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, bio, location, skills_offered, skills_wanted, portfolio, availability, avg_rating, review_count, sessions_completed, xp, level, badges, role, is_verified, is_online, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth callback handler
 */
exports.googleCallback = async (req, res, next) => {
  try {
    const token = generateToken(req.user.id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Format Supabase user row to API response format
 * Maps snake_case DB columns to camelCase for frontend
 */
function formatUser(user) {
  if (!user) return null;
  return {
    _id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || '',
    bio: user.bio || '',
    location: user.location || '',
    skillsOffered: user.skills_offered || [],
    skillsWanted: user.skills_wanted || [],
    portfolio: user.portfolio || [],
    availability: user.availability || [],
    stats: {
      avgRating: parseFloat(user.avg_rating) || 0,
      reviewCount: user.review_count || 0,
      sessionsCompleted: user.sessions_completed || 0,
      xp: user.xp || 0,
      level: user.level || 1,
    },
    badges: user.badges || [],
    role: user.role || 'user',
    isVerified: user.is_verified || false,
    isOnline: user.is_online || false,
    createdAt: user.created_at,
  };
}

// Export for use in other controllers
exports.formatUser = formatUser;
