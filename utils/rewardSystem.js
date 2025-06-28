const LootItem = require('../models/LootItem');

// Reward probabilities
const REWARD_PROBABILITIES = {
  common: 0.6,   // 60%
  rare: 0.3,     // 30%
  epic: 0.1      // 10%
};

// Available loot items by rarity
const LOOT_ITEMS = {
  common: [
    { type: 'badge', name: 'First Steps', icon: '👶', description: 'Started your journey' },
    { type: 'badge', name: 'Consistent', icon: '🔄', description: 'Building good habits' },
    { type: 'theme', name: 'Forest Green', icon: '🌲', description: 'Calm and natural' },
    { type: 'theme', name: 'Ocean Blue', icon: '🌊', description: 'Deep and peaceful' },
    { type: 'effect', name: 'Sparkle', icon: '✨', description: 'Add some magic' },
    { type: 'effect', name: 'Glow', icon: '💫', description: 'Shine bright' }
  ],
  rare: [
    { type: 'badge', name: 'Streak Master', icon: '🔥', description: 'Maintaining impressive streaks' },
    { type: 'badge', name: 'Dedicated', icon: '💪', description: 'Never giving up' },
    { type: 'theme', name: 'Golden Hour', icon: '🌅', description: 'Warm and inspiring' },
    { type: 'theme', name: 'Midnight Purple', icon: '🌙', description: 'Mysterious and elegant' },
    { type: 'avatar', name: 'Warrior', icon: '⚔️', description: 'Battle-ready avatar' },
    { type: 'effect', name: 'Fire Trail', icon: '🔥', description: 'Leave a trail of flames' }
  ],
  epic: [
    { type: 'badge', name: 'Legendary', icon: '👑', description: 'Achieved greatness' },
    { type: 'badge', name: 'Unstoppable', icon: '🚀', description: 'Nothing can stop you' },
    { type: 'theme', name: 'Cosmic', icon: '🌌', description: 'Out of this world' },
    { type: 'theme', name: 'Diamond', icon: '💎', description: 'Precious and rare' },
    { type: 'avatar', name: 'Phoenix', icon: '🦅', description: 'Rise from the ashes' },
    { type: 'effect', name: 'Lightning', icon: '⚡', description: 'Electric energy' }
  ]
};

// Calculate reward based on streak and randomness
const calculateReward = (streak, userId) => {
  const random = Math.random();
  
  // Streak bonus: +1% chance for better rewards per streak day (max 20%)
  const streakBonus = Math.min(streak * 0.01, 0.2);
  
  // Determine reward type
  let rewardType;
  let rewardRarity;
  
  if (random < 0.2) { // 20% chance for nothing
    return {
      type: 'nothing',
      message: 'Better luck next time! 🎰',
      xp: 0
    };
  } else if (random < 0.7) { // 50% chance for XP
    const baseXP = 10;
    const bonusXP = Math.floor(streak / 5) * 5; // +5 XP for every 5 streak days
    const totalXP = baseXP + bonusXP + Math.floor(Math.random() * 6); // +0-5 random
    
    return {
      type: 'xp',
      amount: totalXP,
      message: `Gained ${totalXP} XP! 🌟`,
      xp: totalXP
    };
  } else if (random < 0.85) { // 15% chance for streak protection token
    return {
      type: 'token',
      amount: 1,
      message: 'Earned a Streak Protection Token! 🛡️',
      xp: 5
    };
  } else { // 15% chance for loot
    // Determine rarity with streak bonus
    const rarityRoll = Math.random() - streakBonus;
    
    if (rarityRoll < REWARD_PROBABILITIES.epic) {
      rewardRarity = 'epic';
    } else if (rarityRoll < REWARD_PROBABILITIES.epic + REWARD_PROBABILITIES.rare) {
      rewardRarity = 'rare';
    } else {
      rewardRarity = 'common';
    }
    
    const availableItems = LOOT_ITEMS[rewardRarity];
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    
    return {
      type: 'loot',
      rarity: rewardRarity,
      item: randomItem,
      message: `Found ${rewardRarity} ${randomItem.name}! ${randomItem.icon}`,
      xp: rewardRarity === 'epic' ? 25 : rewardRarity === 'rare' ? 15 : 10
    };
  }
};

// Apply reward to user
const applyReward = async (user, habit, reward) => {
  try {
    // Add XP
    user.xp += reward.xp;
    user.totalHabitsCompleted += 1;
    
    // Handle specific reward types
    switch (reward.type) {
      case 'token':
        user.streakProtectionTokens += reward.amount;
        break;
        
      case 'loot':
        // Create new loot item
        const lootItem = new LootItem({
          userId: user._id,
          type: reward.item.type,
          name: reward.item.name,
          rarity: reward.rarity,
          description: reward.item.description,
          icon: reward.item.icon,
          fromHabit: habit._id
        });
        await lootItem.save();
        break;
    }
    
    await user.save();
    return reward;
  } catch (error) {
    console.error('Error applying reward:', error);
    throw error;
  }
};

// Check if habit can be completed today
const canCompleteHabit = (habit) => {
  if (!habit.lastCompleted) return true;
  
  const today = new Date();
  const lastCompleted = new Date(habit.lastCompleted);
  
  // Check if it's a different day
  return today.toDateString() !== lastCompleted.toDateString();
};

// Update habit streak
const updateStreak = (habit) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (!habit.lastCompleted) {
    // First completion
    habit.streak = 1;
  } else {
    const lastCompleted = new Date(habit.lastCompleted);
    
    if (lastCompleted.toDateString() === yesterday.toDateString()) {
      // Completed yesterday, continue streak
      habit.streak += 1;
    } else if (lastCompleted.toDateString() === today.toDateString()) {
      // Already completed today, no change
      return habit.streak;
    } else {
      // Streak broken, reset
      habit.streak = 1;
    }
  }
  
  habit.lastCompleted = today;
  habit.totalCompletions += 1;
  
  return habit.streak;
};

module.exports = {
  calculateReward,
  applyReward,
  canCompleteHabit,
  updateStreak,
  LOOT_ITEMS,
  REWARD_PROBABILITIES
};
