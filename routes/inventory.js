const express = require('express');
const LootItem = require('../models/LootItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get user's inventory
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, rarity } = req.query;
    
    // Build filter
    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (rarity) filter.rarity = rarity;

    const items = await LootItem.find(filter)
      .sort({ acquiredAt: -1 })
      .populate('fromHabit', 'name icon');

    // Group items by type for easier frontend handling
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});

    // Get inventory stats
    const stats = {
      totalItems: items.length,
      byRarity: {
        common: items.filter(item => item.rarity === 'common').length,
        rare: items.filter(item => item.rarity === 'rare').length,
        epic: items.filter(item => item.rarity === 'epic').length,
        legendary: items.filter(item => item.rarity === 'legendary').length
      },
      byType: {
        theme: items.filter(item => item.type === 'theme').length,
        badge: items.filter(item => item.type === 'badge').length,
        avatar: items.filter(item => item.type === 'avatar').length,
        effect: items.filter(item => item.type === 'effect').length
      },
      equipped: items.filter(item => item.isEquipped).length
    };

    res.json({
      items,
      groupedItems,
      stats
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/inventory/:id/equip
// @desc    Equip/unequip an item
// @access  Private
router.patch('/:id/equip', auth, async (req, res) => {
  try {
    const item = await LootItem.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { equip } = req.body;
    item.isEquipped = equip === undefined ? !item.isEquipped : equip;
    await item.save();

    // Update user's current equipped items
    const user = await User.findById(req.user._id);
    if (item.isEquipped) {
      if (item.type === 'theme') {
        user.currentTheme = item.name;
      } else if (item.type === 'badge') {
        user.currentBadge = item.name;
      }
    } else {
      if (item.type === 'theme' && user.currentTheme === item.name) {
        user.currentTheme = 'default';
      } else if (item.type === 'badge' && user.currentBadge === item.name) {
        user.currentBadge = null;
      }
    }
    await user.save();

    res.json({
      message: `Item ${item.isEquipped ? 'equipped' : 'unequipped'} successfully`,
      item
    });
  } catch (error) {
    console.error('Equip item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/equipped
// @desc    Get currently equipped items
// @access  Private
router.get('/equipped', auth, async (req, res) => {
  try {
    const equippedItems = await LootItem.find({
      userId: req.user._id,
      isEquipped: true
    });

    const equipped = {
      theme: equippedItems.find(item => item.type === 'theme') || null,
      badge: equippedItems.find(item => item.type === 'badge') || null,
      avatar: equippedItems.find(item => item.type === 'avatar') || null,
      effect: equippedItems.find(item => item.type === 'effect') || null
    };

    res.json(equipped);
  } catch (error) {
    console.error('Get equipped items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
