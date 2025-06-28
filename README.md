# 🎰 Impulse: The Habit Casino

An addictive habit tracker that uses slot-machine-style reward mechanics to make micro-habit completion engaging and compulsive. Users complete habits and receive randomized rewards, building streaks, collecting loot, and unlocking cosmetic features.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Habit Management**: Create, track, and complete daily habits
- **Slot Machine Rewards**: Randomized reward system with XP, loot, and streak protection tokens
- **Streak Tracking**: Build and maintain habit streaks with visual feedback
- **Inventory System**: Collect and equip cosmetic items (themes, badges, avatars)
- **Leaderboard**: Compete with other users based on XP and completions
- **Responsive UI**: Beautiful casino-themed interface with smooth animations

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication (access + refresh tokens)
- **bcryptjs** - Password hashing
- **node-cron** - Scheduled tasks
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animations and transitions
- **Axios** - HTTP client
- **React Router** - Client-side routing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd impulse
```

### 2. Install Dependencies
```bash
# Install dependencies for both client and server
npm run install-all

# Or install separately:
npm run install-server  # Backend dependencies
npm run install-client  # Frontend dependencies
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_different_from_above
NODE_ENV=development
PORT=****
```

**Important**: Replace the JWT secrets with your own secure random strings in production.

### 4. Frontend Environment (Optional)
Create a `.env` file in the client directory for custom API URL:
```env
REACT_APP_API_URL=http://localhost:****/api
```

## 🚀 Running the Application

### Development Mode (Recommended)
Run both backend and frontend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:****`
- Frontend development server on `http://localhost:3000`

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

### Production Build
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## 📱 Usage

1. **Register/Login**: Create an account or sign in
2. **Create Habits**: Add daily habits with custom icons and descriptions
3. **Complete Habits**: Click "Complete & Spin" to trigger the slot machine
4. **Earn Rewards**: Get XP, loot items, or streak protection tokens
5. **Build Streaks**: Maintain daily completions to build impressive streaks
6. **Collect Loot**: Unlock themes, badges, and other cosmetic items
7. **Compete**: Check the leaderboard to see how you rank against others

## 🎰 Reward System

### Reward Types
- **XP (50% chance)**: Experience points for leveling up
- **Loot (15% chance)**: Cosmetic items (themes, badges, avatars)
- **Streak Protection Token (15% chance)**: Protects your streak if you miss a day
- **Nothing (20% chance)**: Better luck next time!

### Reward Rarities
- **Common (60%)**: Basic themes and badges
- **Rare (30%)**: Enhanced themes and special badges
- **Epic (10%)**: Legendary themes and exclusive items

### Streak Bonuses
- Longer streaks increase the chance of getting better rewards
- +1% chance improvement per streak day (max 20%)
- Bonus XP for longer streaks

## 🏗 Project Structure

```
impulse/
├── server/                 # Backend application
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Authentication middleware
│   ├── utils/             # Utility functions (reward system)
│   └── index.js           # Server entry point
├── src/                   # Frontend application
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── habits/       # Habit management components
│   │   ├── rewards/      # Reward system components
│   │   └── common/       # Shared components
│   ├── contexts/         # React contexts
│   ├── services/         # API services
│   └── App.js            # Main app component
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT access tokens (15-minute expiry)
- JWT refresh tokens (7-day expiry)
- Automatic token refresh
- Input validation and sanitization
- CORS protection
- Environment variable protection

## 🎨 Customization

### Adding New Habit Icons
Edit `src/components/habits/CreateHabitModal.js` and add to the `HABIT_ICONS` array.

### Adding New Loot Items
Edit `server/utils/rewardSystem.js` and add items to the `LOOT_ITEMS` object.

### Customizing Reward Probabilities
Modify the `REWARD_PROBABILITIES` in `server/utils/rewardSystem.js`.

### Theming
Update Tailwind configuration in `tailwind.config.js` to customize colors and animations.

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Verify network connectivity

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=3001 npm run server
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

### Frontend Deployment (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Set up environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🎮 Game Mechanics

### Level System
- Level = floor(XP / 100) + 1
- Each level requires 100 more XP than the previous

### Streak Protection
- Tokens can be used to maintain streaks when habits are missed
- Automatic protection (planned feature)

### Daily Reset
- Habits reset daily at midnight
- Streaks are maintained if completed within 24 hours

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository or contact me.

---

**Ready to start your habit casino journey? Let's spin the wheel of success! 🎰✨**
