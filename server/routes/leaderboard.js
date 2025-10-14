import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get leaderboard data
router.get('/', async (req, res) => {
  try {
    const { limit = 50, sortBy = 'points' } = req.query;

    const sortOptions = {};
    if (sortBy === 'points') {
      sortOptions.points = -1;
      sortOptions.codecoins = -1;
    } else if (sortBy === 'codecoins') {
      sortOptions.codecoins = -1;
      sortOptions.points = -1;
    }

    const leaderboard = await User.find({
      $or: [
        { isAdmin: { $ne: true } },
        { isAdmin: { $exists: false } },
        { role: { $ne: 'admin' } }
      ]
    })
      .select('username points codecoins avatarUrl')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: rankedLeaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

export default router;
