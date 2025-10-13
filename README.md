# EarnByCode - Code Your Way To Earning.

A full-stack MERN application that gamifies competitive programming with real money rewards, built with modern web technologies to provide a seamless coding experience.

## 🚀 Features

### Core Platform
- **Problem Solving**: 1000+ coding challenges with real-time compilation and execution
- **Contest System**: Live programming contests with entry fees and cash prizes
- **Codecoin Economy**: Earn 1 codecoin per solved problem (redeemable for rewards)
- **User Profiles**: Customizable profiles with performance analytics and achievements
- **Discussion Forums**: Community-driven problem discussions and solutions
- **Payment Integration**: Stripe integration for deposits/withdrawals
- **Real-time Leaderboard**: Global rankings based on performance

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

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: Redux Toolkit & React Query
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation
- **Real-time**: Socket.IO client
- **Testing**: Jest + React Testing Library
- **Linting/Formatting**: ESLint + Prettier

### Backend
- **Runtime**: Node.js 18+ with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & OAuth 2.0 (Google, GitHub)
- **API**: RESTful architecture with OpenAPI documentation
- **Real-time**: Socket.IO server
- **Caching**: Redis for session and rate limiting
- **File Storage**: Local filesystem with Multer
- **Testing**: Jest + Supertest
- **Validation**: Joi for request validation
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, rate limiting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB 6.0+ (local or Atlas)
- Redis (for production)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dheerajgaurgithub/AlgoBucks.git
   cd AlgoBucks
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `client` and `server` directories
   - Update the environment variables with your configuration

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev
   
   # In a new terminal, start frontend
   cd client
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🔐 Default Admin Credentials

**Admin Login:**
- Email: `admin@algobucks.com`
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

### Production Build

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Copy build files to server:
   ```bash
   # From project root
   cp -r client/dist/* server/public/
   ```

3. Start the production server:
   ```bash
   cd server
   NODE_ENV=production node server.js
   ```

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd server
NODE_ENV=production pm2 start server.js --name algobucks-api

# Enable load balancer (for multi-core systems)
pm2 scale algobucks-api 2

# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Save the startup command that PM2 provides
```

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t algobucks .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e MONGODB_URI=your_mongodb_uri \
     -e JWT_SECRET=your_jwt_secret \
     algobucks
   ```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- Report bugs
- Suggest new features
- Submit code improvements
- Improve documentation
- Help with testing

### Development Workflow

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```bash
   # Run server tests
   cd server && npm test
   
   # Run client tests
   cd ../client && npm test
   ```
5. Ensure code quality:
   ```bash
   npm run lint
   npm run format
   ```
6. Commit your changes with a descriptive message
7. Push to your fork and open a Pull Request

### Code Style
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation when necessary

## 📄 License

MIT License - see LICENSE file for details.

---

# AlgoBucks - Think smart. Code harder. Earn more.
