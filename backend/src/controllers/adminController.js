const supabase = require('../config/supabase');

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const [usersRes, sessionsRes, reviewsRes, activeRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_online', true),
    ]);

    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, avatar, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      stats: {
        totalUsers: usersRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        activeUsers: activeRes.count || 0,
      },
      recentUsers: (recentUsers || []).map(u => ({
        _id: u.id, name: u.name, email: u.email, avatar: u.avatar, createdAt: u.created_at,
      })),
      recentSessions: recentSessions || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin)
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, email, name, avatar, role, is_online, xp, level, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;
    if (error) throw error;

    res.json({
      users: (users || []).map(u => ({
        _id: u.id, email: u.email, name: u.name, avatar: u.avatar,
        role: u.role, isOnline: u.is_online, stats: { xp: u.xp, level: u.level }, createdAt: u.created_at,
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count || 0 },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (admin)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user (admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
