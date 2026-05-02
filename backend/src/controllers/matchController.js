const supabase = require('../config/supabase');
const { formatUser } = require('./authController');

/**
 * Smart Matching Algorithm
 * Finds the best skill exchange partners for a user
 *
 * Score = skillCompatibility * 0.5 + levelMatch * 0.25 + availabilityOverlap * 0.25
 */

function calculateMatchScore(currentUser, candidateUser) {
  let skillScore = 0;
  let levelScore = 0;
  let availabilityScore = 0;
  let matchedSkills = { canTeach: [], canLearn: [] };

  const myOffered = currentUser.skills_offered || currentUser.skillsOffered || [];
  const myWanted = currentUser.skills_wanted || currentUser.skillsWanted || [];
  const theirOffered = candidateUser.skills_offered || candidateUser.skillsOffered || [];
  const theirWanted = candidateUser.skills_wanted || candidateUser.skillsWanted || [];

  // Does candidate teach what current user wants?
  const canLearnFrom = myWanted.filter(wanted =>
    theirOffered.some(offered => offered.name?.toLowerCase() === wanted.name?.toLowerCase())
  );

  // Does candidate want what current user teaches?
  const canTeachTo = myOffered.filter(offered =>
    theirWanted.some(wanted => wanted.name?.toLowerCase() === offered.name?.toLowerCase())
  );

  if (canLearnFrom.length > 0 && canTeachTo.length > 0) {
    skillScore = 1.0;
  } else if (canLearnFrom.length > 0 || canTeachTo.length > 0) {
    skillScore = 0.5;
  }
  matchedSkills.canTeach = canTeachTo.map(s => s.name);
  matchedSkills.canLearn = canLearnFrom.map(s => s.name);

  // Level compatibility
  const levelMap = { beginner: 1, intermediate: 2, advanced: 3 };
  if (canLearnFrom.length > 0) {
    const avgLevelDiff = canLearnFrom.reduce((sum, wanted) => {
      const offered = theirOffered.find(o => o.name?.toLowerCase() === wanted.name?.toLowerCase());
      if (!offered) return sum;
      const diff = Math.abs((levelMap[offered.level] || 2) - (levelMap[wanted.level] || 1));
      return sum + (diff <= 1 ? 1 : 0.5);
    }, 0) / canLearnFrom.length;
    levelScore = avgLevelDiff;
  }

  // Availability overlap
  const myAvail = currentUser.availability || [];
  const theirAvail = candidateUser.availability || [];
  if (myAvail.length > 0 && theirAvail.length > 0) {
    const sharedDays = myAvail.filter(a => theirAvail.some(b => b.day === a.day));
    availabilityScore = Math.min(sharedDays.length / 3, 1);
  } else {
    availabilityScore = 0.5;
  }

  const totalScore = skillScore * 0.5 + levelScore * 0.25 + availabilityScore * 0.25;

  return {
    score: Math.round(totalScore * 100) / 100,
    matchedSkills,
    compatibility: {
      skills: Math.round(skillScore * 100),
      level: Math.round(levelScore * 100),
      availability: Math.round(availabilityScore * 100),
    },
  };
}

/**
 * Find matches for a user
 * GET /api/matches
 */
exports.findMatches = async (req, res, next) => {
  try {
    // Get current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const myOffered = currentUser.skills_offered || [];
    const myWanted = currentUser.skills_wanted || [];

    if (myOffered.length === 0 && myWanted.length === 0) {
      return res.json({ matches: [], message: 'Add skills to your profile to find matches' });
    }

    // Get all other users (exclude self and blocked)
    const blocked = currentUser.blocked_users || [];
    const excludeIds = [req.userId, ...blocked];

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id, name, avatar, bio, skills_offered, skills_wanted, availability, avg_rating, review_count, sessions_completed, xp, level, badges, is_online')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(100);

    if (error) throw error;

    // Score and sort matches
    const matches = (candidates || [])
      .map(candidate => {
        const matchData = calculateMatchScore(currentUser, candidate);
        return { user: formatUser(candidate), ...matchData };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

/**
 * Get skill recommendations
 * GET /api/matches/recommendations
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('skills_offered, skills_wanted');

    // Aggregate skill counts
    const offeredCounts = {};
    const wantedCounts = {};

    (users || []).forEach(u => {
      (u.skills_offered || []).forEach(s => {
        offeredCounts[s.name] = (offeredCounts[s.name] || { count: 0, category: s.category });
        offeredCounts[s.name].count++;
      });
      (u.skills_wanted || []).forEach(s => {
        wantedCounts[s.name] = (wantedCounts[s.name] || { count: 0, category: s.category });
        wantedCounts[s.name].count++;
      });
    });

    const trendingOffered = Object.entries(offeredCounts)
      .map(([name, data]) => ({ _id: name, count: data.count, category: data.category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const trendingWanted = Object.entries(wantedCounts)
      .map(([name, data]) => ({ _id: name, count: data.count, category: data.category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const highDemand = trendingWanted.filter(wanted => {
      const offered = trendingOffered.find(o => o._id === wanted._id);
      return !offered || offered.count < wanted.count;
    });

    res.json({
      trending: { offered: trendingOffered, wanted: trendingWanted },
      highDemand,
      suggestion: 'Learning high-demand skills increases your match potential!',
    });
  } catch (error) {
    next(error);
  }
};
