const express = require('express');
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { calculateReward, applyReward, canCompleteHabit, updateStreak } = require('../utils/rewardSystem');

const router = express.Router();

// @route   GET /api/habits
// @desc    Get all habits for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = new Habit({
      userId: req.user._id,
      name: name.trim(),
      icon: icon || '⭐',
      description: description ? description.trim() : ''
    });

    await habit.save();

    res.status(201).json({
      message: 'Habit created successfully',
      habit
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/habits/:id
// @desc    Update a habit
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (name !== undefined) habit.name = name.trim();
    if (icon !== undefined) habit.icon = icon;
    if (description !== undefined) habit.description = description.trim();

    await habit.save();

    res.json({
      message: 'Habit updated successfully',
      habit
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Soft delete - mark as inactive
    habit.isActive = false;
    await habit.save();

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/habits/:id/complete
// @desc    Complete a habit and trigger reward system
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit can be completed today
    if (!canCompleteHabit(habit)) {
      return res.status(400).json({ 
        message: 'Habit already completed today',
        alreadyCompleted: true
      });
    }

    // Update streak
    const newStreak = updateStreak(habit);
    
    // Calculate reward
    const reward = calculateReward(newStreak, req.user._id);
    
    // Apply reward to user
    const user = await User.findById(req.user._id);
    await applyReward(user, habit, reward);
    
    // Add completion to history
    habit.completionHistory.push({
      date: new Date(),
      reward: reward.type,
      rewardAmount: reward.amount || 0,
      rewardItem: reward.item ? reward.item.name : null
    });

    await habit.save();

    // Get updated user data
    const updatedUser = await User.findById(req.user._id).select('-passwordHash -refreshToken');

    res.json({
      message: 'Habit completed successfully! 🎉',
      habit,
      reward,
      user: updatedUser,
      streak: newStreak
    });
  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/habits/:id/history
// @desc    Get completion history for a habit
// @access  Private
router.get('/:id/history', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Get completion history with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const history = habit.completionHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + limit);

    res.json({
      habit: {
        id: habit._id,
        name: habit.name,
        icon: habit.icon
      },
      history,
      pagination: {
        page,
        limit,
        total: habit.completionHistory.length,
        pages: Math.ceil(habit.completionHistory.length / limit)
      }
    });
  } catch (error) {
    console.error('Get habit history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/habits/stats
// @desc    Get habit statistics for user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user._id,
      isActive: true 
    });

    const stats = {
      totalHabits: habits.length,
      totalCompletions: habits.reduce((sum, habit) => sum + habit.totalCompletions, 0),
      averageStreak: habits.length > 0 ? 
        habits.reduce((sum, habit) => sum + habit.streak, 0) / habits.length : 0,
      bestStreak: Math.max(...habits.map(habit => habit.bestStreak), 0),
      activeStreaks: habits.filter(habit => habit.streak > 0).length,
      habitsCompletedToday: habits.filter(habit => {
        if (!habit.lastCompleted) return false;
        const today = new Date().toDateString();
        const lastCompleted = new Date(habit.lastCompleted).toDateString();
        return today === lastCompleted;
      }).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
