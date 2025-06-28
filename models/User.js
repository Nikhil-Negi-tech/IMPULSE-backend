const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  totalHabitsCompleted: {
    type: Number,
    default: 0
  },
  currentTheme: {
    type: String,
    default: 'default'
  },
  currentBadge: {
    type: String,
    default: null
  },
  streakProtectionTokens: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Calculate level based on XP
userSchema.virtual('calculatedLevel').get(function() {
  return Math.floor(this.xp / 100) + 1;
});

// Update level when XP changes
userSchema.pre('save', function(next) {
  this.level = Math.floor(this.xp / 100) + 1;
  next();
});

module.exports = mongoose.model('User', userSchema);
