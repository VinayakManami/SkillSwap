const supabase = require('../config/supabase');
const { formatUser } = require('./authController');

/**
 * Create a new session
 * POST /api/sessions
 */
exports.createSession = async (req, res, next) => {
  try {
    const { participantId, skillExchanged, scheduledAt, duration } = req.body;

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        participant_ids: [req.userId, participantId],
        skill_teaching: skillExchanged?.teaching || '',
        skill_learning: skillExchanged?.learning || '',
        scheduled_at: scheduledAt,
        duration: duration || 60,
      })
      .select()
      .single();

    if (error) throw error;

    // Get participant details
    const { data: participants } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', session.participant_ids);

    res.status(201).json({
      message: 'Session scheduled',
      session: formatSession(session, participants),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's sessions
 * GET /api/sessions?status=scheduled
 */
exports.getSessions = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('sessions')
      .select('*')
      .filter('participant_ids', 'cs', JSON.stringify([req.userId]))
      .order('scheduled_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: sessions, error } = await query;
    if (error) throw error;

    // Get all participant IDs
    const allParticipantIds = [...new Set((sessions || []).flatMap(s => s.participant_ids))];
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', allParticipantIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const formatted = (sessions || []).map(s => {
      const participants = s.participant_ids.map(id => userMap[id] || { id, name: 'Unknown' });
      return formatSession(s, participants);
    });

    res.json({ sessions: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Update session status
 * PATCH /api/sessions/:id/status
 */
exports.updateSessionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Verify user is a participant
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', req.params.id)
      .filter('participant_ids', 'cs', JSON.stringify([req.userId]))
      .single();

    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { data: updated, error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If completed, award XP to both participants
    if (status === 'completed') {
      for (const pid of session.participant_ids) {
        const { data: u } = await supabase.from('users').select('sessions_completed, xp').eq('id', pid).single();
        if (u) {
          await supabase.from('users').update({
            sessions_completed: (u.sessions_completed || 0) + 1,
            xp: (u.xp || 0) + 50,
          }).eq('id', pid);
        }
      }
    }

    res.json({ message: 'Session updated', session: formatSession(updated) });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a review for a session
 * POST /api/sessions/:id/review
 */
exports.createReview = async (req, res, next) => {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Find the other participant
    const revieweeId = session.participant_ids.find(p => p !== req.userId);

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        session_id: session.id,
        reviewer_id: req.userId,
        reviewee_id: revieweeId,
        rating: req.body.rating,
        comment: req.body.comment || '',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ message: 'Already reviewed this session' });
      throw error;
    }

    // Update reviewee's average rating
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId);

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await supabase.from('users').update({
      avg_rating: Math.round(avgRating * 10) / 10,
      review_count: allReviews.length,
    }).eq('id', revieweeId);

    // Award XP for giving a review
    const { data: reviewer } = await supabase.from('users').select('xp').eq('id', req.userId).single();
    await supabase.from('users').update({ xp: (reviewer?.xp || 0) + 20 }).eq('id', req.userId);

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    next(error);
  }
};

/**
 * Format session for API response
 */
function formatSession(session, participants = []) {
  return {
    _id: session.id,
    participants: participants.map(p => ({ _id: p.id, name: p.name, avatar: p.avatar || '' })),
    skillExchanged: { teaching: session.skill_teaching, learning: session.skill_learning },
    scheduledAt: session.scheduled_at,
    duration: session.duration,
    status: session.status,
    notes: session.notes,
    createdAt: session.created_at,
  };
}
