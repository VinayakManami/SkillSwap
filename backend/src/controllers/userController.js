const supabase = require('../config/supabase');
const { formatUser } = require('./authController');

/**
 * Get user profile by ID
 * GET /api/users/:id
 */
exports.getUser = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, bio, location, skills_offered, skills_wanted, portfolio, availability, avg_rating, review_count, sessions_completed, xp, level, badges, role, is_verified, is_online, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * PUT /api/users/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const fieldMap = {
      name: 'name',
      bio: 'bio',
      location: 'location',
      avatar: 'avatar',
      skillsOffered: 'skills_offered',
      skillsWanted: 'skills_wanted',
      portfolio: 'portfolio',
      availability: 'availability',
    };

    Object.entries(fieldMap).forEach(([camel, snake]) => {
      if (req.body[camel] !== undefined) {
        updates[snake] = req.body[camel];
      }
    });

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select('id, email, name, avatar, bio, location, skills_offered, skills_wanted, portfolio, availability, avg_rating, review_count, sessions_completed, xp, level, badges, role, is_verified, is_online, created_at')
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated', user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filtering
 * GET /api/users?skill=JavaScript&page=1&limit=20
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { skill, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, avatar, bio, skills_offered, skills_wanted, avg_rating, review_count, sessions_completed, xp, level, badges, is_online', { count: 'exact' })
      .neq('id', req.userId)
      .order('xp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: users, error, count } = await query;
    if (error) throw error;

    // Client-side skill filter (JSONB contains check)
    let filtered = users || [];
    if (skill) {
      filtered = filtered.filter(u =>
        (u.skills_offered || []).some(s => s.name?.toLowerCase().includes(skill.toLowerCase()))
      );
    }

    res.json({
      users: filtered.map(formatUser),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a user
 * GET /api/users/:id/reviews
 */
exports.getUserReviews = async (req, res, next) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_id')
      .eq('reviewee_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Get reviewer details
    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
    const { data: reviewers } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', reviewerIds);

    const reviewerMap = {};
    (reviewers || []).forEach(r => { reviewerMap[r.id] = r; });

    const formattedReviews = reviews.map(r => ({
      _id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      reviewerId: reviewerMap[r.reviewer_id] || { name: 'Unknown' },
    }));

    res.json({ reviews: formattedReviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard
 * GET /api/users/leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, avatar, xp, level, sessions_completed, avg_rating, badges')
      .order('xp', { ascending: false })
      .limit(50);

    if (error) throw error;

    const leaderboard = (users || []).map(u => ({
      _id: u.id,
      name: u.name,
      avatar: u.avatar,
      stats: { xp: u.xp || 0, level: u.level || 1, sessionsCompleted: u.sessions_completed || 0, avgRating: parseFloat(u.avg_rating) || 0 },
      badges: u.badges || [],
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * Block a user
 * POST /api/users/:id/block
 */
exports.blockUser = async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('blocked_users')
      .eq('id', req.userId)
      .single();

    const blocked = user?.blocked_users || [];
    if (!blocked.includes(req.params.id)) {
      blocked.push(req.params.id);
    }

    await supabase.from('users').update({ blocked_users: blocked }).eq('id', req.userId);
    res.json({ message: 'User blocked' });
  } catch (error) {
    next(error);
  }
};
