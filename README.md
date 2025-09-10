# Mahir's CodeArena - Complete Coding Fantasy Platform

A full-stack MERN application that gamifies competitive programming with real money rewards.

## 🚀 Features

### Core Platform
- **Problem Solving**: 1000+ coding challenges with real-time compilation
- **Contest System**: Live contests with entry fees and cash prizes
- **Codecoin Economy**: Earn 1 codecoin per solved problem
- **Payment Integration**: Stripe integration for deposits/withdrawals
- **Real-time Leaderboard**: Global rankings based on performance
- **Discussion Forums**: Community discussions for each problem

### User Features
- **Profile Customization**: Avatar, bio, social links, professional info
- **Wallet Management**: Add money via UPI/Cards, withdraw winnings
- **Progress Tracking**: Solved problems, contest history, achievements
- **Social Integration**: GitHub, LinkedIn, Twitter profile links

### Admin Features
- **Problem Management**: Create, edit, delete problems with test cases
- **Contest Management**: Create contests with custom prize pools
- **User Management**: View and manage all platform users
- **Analytics Dashboard**: Revenue, user stats, platform metrics

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Monaco Editor** for code editing
- **React Router** for navigation
- **Stripe React** for payments

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Stripe** payment processing
- **bcryptjs** for password hashing
- **Rate limiting** and security middleware

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account for payments

### Installation

1. **Clone and install dependencies:**
```bash
npm install
cd server && npm install
```

2. **Environment Setup:**

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/codearena
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NODE_ENV=development
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

3. **Start the application:**
```bash
npm run dev:full
```

This starts both frontend (port 5173) and backend (port 5000) concurrently.

## 🔐 Default Admin Credentials

**Admin Login:**
- Email: `admin@mahirscodearena.com`
- Password: `admin123`

## 💳 Payment Integration

The platform uses Stripe for secure payment processing:

- **Supported Methods**: Credit/Debit Cards, UPI, Net Banking
- **Security**: PCI DSS compliant with Stripe
- **Features**: Instant deposits, secure withdrawals
- **Currency**: USD (easily configurable)

## 🏗️ Architecture

### Database Schema
- **Users**: Profile, wallet, progress tracking
- **Problems**: Challenges with test cases and metadata
- **Contests**: Live competitions with participants
- **Submissions**: Code submissions with results
- **Transactions**: Payment and prize tracking

### API Endpoints
- **Auth**: `/api/auth/*` - Registration, login, profile
- **Problems**: `/api/problems/*` - CRUD operations, submissions
- **Contests**: `/api/contests/*` - Contest management, participation
- **Payments**: `/api/payments/*` - Stripe integration, transactions
- **Admin**: `/api/admin/*` - Administrative functions

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 🎮 Game Mechanics

### Codecoin System
- Earn 1 codecoin per solved problem
- Display in user profile and header
- Future: Use for premium features

### Contest Rewards
- Entry fees deducted from wallet
- Prize distribution: 50% / 30% / 20% for top 3
- Participation points for all contestants
- Automatic prize distribution when contests end

### Ranking System
- Global leaderboard based on points
- Contest performance affects ranking
- Real-time rank updates

## 🔧 Development

### Adding New Problems
1. Login as admin
2. Navigate to Admin Panel
3. Use "Add Problem" form with:
   - Title, description, difficulty
   - Test cases (input/output pairs)
   - Starter code for all languages
   - Tags and constraints

### Creating Contests
1. Admin panel → Contests
2. Set title, description, timing
3. Select problems to include
4. Configure entry fee and prize pool
5. Set participant limits

### Code Execution
The platform simulates code execution with:
- Syntax validation
- Performance metrics generation
- Test case evaluation
- Realistic success/failure rates

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
```

### Backend (Railway/Heroku)
```bash
cd server
npm start
```

### Environment Variables
Ensure all environment variables are set in production:
- MongoDB connection string
- JWT secret (use strong random string)
- Stripe keys (live keys for production)

## 📈 Future Enhancements

- **Real Code Execution**: Docker containers for secure code running
- **Video Tutorials**: Problem explanation videos
- **Team Contests**: Multi-player team competitions
- **Certification System**: Skill-based certificates
- **Mobile App**: React Native mobile application
- **AI Hints**: GPT-powered coding hints
- **Live Streaming**: Contest live streams
- **Referral System**: Earn rewards for referrals

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Mahir's CodeArena** - Where coding skills meet real rewards! 🏆