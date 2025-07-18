const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      passwordHash
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        currentTheme: user.currentTheme,
        currentBadge: user.currentBadge
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (tokenError) {
      // If token is expired or invalid, clear it and return error
      console.log('Refresh token validation failed:', tokenError.message);
      
      // If it's an expired token, try to find the user and clear their refresh token
      if (tokenError.name === 'TokenExpiredError') {
        try {
          const expiredDecoded = jwt.decode(refreshToken);
          if (expiredDecoded && expiredDecoded.userId) {
            const user = await User.findById(expiredDecoded.userId);
            if (user && user.refreshToken === refreshToken) {
              user.refreshToken = null;
              await user.save();
              console.log('Cleared expired refresh token for user:', expiredDecoded.userId);
            }
          }
        } catch (cleanupError) {
          console.log('Error cleaning up expired token:', cleanupError.message);
        }
      }
      
      return res.status(403).json({ 
        message: 'Refresh token expired or invalid',
        shouldLogout: true 
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ 
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(403).json({ 
      message: 'Invalid refresh token',
      shouldLogout: true 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        xp: req.user.xp,
        level: req.user.level,
        totalHabitsCompleted: req.user.totalHabitsCompleted,
        currentTheme: req.user.currentTheme,
        currentBadge: req.user.currentBadge,
        streakProtectionTokens: req.user.streakProtectionTokens,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/cleanup-tokens
// @desc    Clear all expired refresh tokens (admin/maintenance route)
// @access  Public (for now, but should be admin-only in production)
router.post('/cleanup-tokens', async (req, res) => {
  try {
    const result = await User.updateMany(
      { refreshToken: { $ne: null } },
      { $set: { refreshToken: null } }
    );
    
    console.log(`Cleared ${result.modifiedCount} refresh tokens`);
    res.json({ 
      message: 'All refresh tokens cleared successfully',
      tokensCleared: result.modifiedCount
    });
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({ message: 'Server error during token cleanup' });
  }
});

module.exports = router;
