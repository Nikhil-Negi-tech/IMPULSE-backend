const mongoose = require('mongoose');

const lootItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['theme', 'badge', 'avatar', 'effect'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  icon: {
    type: String,
    default: '🎁'
  },
  isEquipped: {
    type: Boolean,
    default: false
  },
  acquiredAt: {
    type: Date,
    default: Date.now
  },
  fromHabit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null
  }
}, {
  timestamps: true
});

// Only one item of each type can be equipped at a time
lootItemSchema.pre('save', async function(next) {
  if (this.isEquipped && this.isModified('isEquipped')) {
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        type: this.type, 
        _id: { $ne: this._id },
        isEquipped: true 
      },
      { isEquipped: false }
    );
  }
  next();
});

module.exports = mongoose.model('LootItem', lootItemSchema);
