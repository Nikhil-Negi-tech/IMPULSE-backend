const express = require('express');
const User = require('../models/User');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get leaderboard data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { timeframe = 'all-time', limit = 10 } = req.query;
    
    let leaderboard;
    const currentUserId = req.user._id;

    if (timeframe === 'all-time') {
      leaderboard = await User.find({})
        .select('username xp level totalHabitsCompleted currentBadge')
        .sort({ xp: -1 })
        .limit(parseInt(limit));
    } else if (timeframe === 'weekly') {
      // For weekly leaderboard, we need to calculate habits completed in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get all users
      const users = await User.find({})
        .select('username xp level totalHabitsCompleted currentBadge');

      // Calculate weekly completions for each user
      const usersWithWeeklyStats = await Promise.all(
        users.map(async (user) => {
          const habits = await Habit.find({ userId: user._id, isActive: true });
          
          let weeklyCompletions = 0;
          habits.forEach(habit => {
            weeklyCompletions += habit.completionHistory.filter(completion => 
              new Date(completion.date) >= weekAgo
            ).length;
          });

          return {
            _id: user._id,
            username: user.username,
            xp: user.xp,
            level: user.level,
            totalHabitsCompleted: user.totalHabitsCompleted,
            currentBadge: user.currentBadge,
            weeklyCompletions
          };
        })
      );

      leaderboard = usersWithWeeklyStats
        .sort((a, b) => b.weeklyCompletions - a.weeklyCompletions)
        .slice(0, parseInt(limit));
    }

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user.toObject ? user.toObject() : user,
      rank: index + 1,
      isCurrentUser: user._id.toString() === currentUserId.toString()
    }));

    // Find current user's position if not in top list
    let currentUserRank = null;
    const currentUserInList = rankedLeaderboard.find(user => user.isCurrentUser);
    
    if (!currentUserInList) {
      if (timeframe === 'all-time') {
        const currentUserPosition = await User.countDocuments({ xp: { $gt: req.user.xp } });
        currentUserRank = {
          rank: currentUserPosition + 1,
          username: req.user.username,
          xp: req.user.xp,
          level: req.user.level,
          totalHabitsCompleted: req.user.totalHabitsCompleted,
          currentBadge: req.user.currentBadge,
          isCurrentUser: true
        };
      }
    }

    res.json({
      leaderboard: rankedLeaderboard,
      currentUser: currentUserInList || currentUserRank,
      timeframe,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get overall leaderboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHabitsCompleted = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalHabitsCompleted' } } }
    ]);

    const topUser = await User.findOne({})
      .select('username xp level')
      .sort({ xp: -1 });

    const averageXP = await User.aggregate([
      { $group: { _id: null, avg: { $avg: '$xp' } } }
    ]);

    const stats = {
      totalUsers,
      totalHabitsCompleted: totalHabitsCompleted[0]?.total || 0,
      topUser,
      averageXP: Math.round(averageXP[0]?.avg || 0),
      currentUserRank: await User.countDocuments({ xp: { $gt: req.user.xp } }) + 1
    };

    res.json(stats);
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
