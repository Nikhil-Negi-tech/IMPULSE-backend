const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  icon: {
    type: String,
    default: '⭐'
  },
  description: {
    type: String,
    maxlength: 500
  },
  streak: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  lastCompleted: {
    type: Date,
    default: null
  },
  totalCompletions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completionHistory: [{
    date: {
      type: Date,
      required: true
    },
    reward: {
      type: String,
      enum: ['xp', 'loot', 'token', 'nothing'],
      required: true
    },
    rewardAmount: {
      type: Number,
      default: 0
    },
    rewardItem: {
      type: String,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Update best streak when streak changes
habitSchema.pre('save', function(next) {
  if (this.streak > this.bestStreak) {
    this.bestStreak = this.streak;
  }
  next();
});

module.exports = mongoose.model('Habit', habitSchema);
