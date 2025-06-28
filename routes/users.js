const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/users/profile
// @desc    Update user profile
// @access  Private
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, currentTheme, currentBadge } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    if (currentTheme !== undefined) user.currentTheme = currentTheme;
    if (currentBadge !== undefined) user.currentBadge = currentBadge;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
