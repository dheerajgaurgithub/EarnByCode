import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import fs from 'fs';

// Import configurations
import { googleConfig } from './config/auth.js';
import './config/passport.js';
import config from './config/config.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import problemRoutes from './routes/problems.js';
import contestRoutes from './routes/contests.js';
import submissionRoutes from './routes/submissions.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import jobRoutes from './routes/jobs.js';
import paymentRoutes from './routes/payments.js';
import discussionRoutes from './routes/discussions.js';
import contestProblemRoutes from './routes/contestProblems.js';
import oauthRoutes from './routes/oauth.js';
import walletRoutes from './routes/wallet.js';

// Initialize express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Middleware
app.use(helmet());
// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://algobucks-tau.vercel.app',
  'https://www.algobucks-tau.vercel.app',
  config.FRONTEND_URL
].filter(Boolean);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin header - allowing request');
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode - allowing origin:', origin);
      return callback(null, true);
    }
    
    // Check if origin is in allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check for subdomains
    try {
      const originHostname = new URL(origin).hostname;
      const isSubdomain = allowedOrigins.some(allowed => {
        try {
          const allowedHostname = new URL(allowed).hostname;
          return originHostname === allowedHostname || 
                 originHostname.endsWith('.' + allowedHostname);
        } catch (e) {
          return false;
        }
      });
      
      if (isSubdomain) {
        return callback(null, true);
      }
    } catch (e) {
      console.error('Error checking origin:', e);
    }
    
    console.warn('CORS Blocked:', origin, 'not in allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 600 // 10 minutes
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'difficulty',
    'tags',
    'points',
    'duration',
    'startDate',
    'endDate'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Session configuration
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public directory
const publicPath = path.join(__dirname, '../../public');

// Security headers for static files
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://algobucks.onrender.com', 'http://localhost:5000'],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Serve static files with cache control
const staticOptions = {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.match(/\.(js|css|json|html|ico|svg|png|jpg|jpeg|gif|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

// Ensure uploads directory exists
const uploadsDir = path.join(publicPath, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use(express.static(publicPath, staticOptions));

// Serve uploaded files with proper caching and security
app.use('/uploads', express.static(path.join(publicPath, 'uploads'), {
  ...staticOptions,
  setHeaders: (res, path) => {
    // Set proper cache control for uploaded files
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Security headers for uploaded content
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/contest-problems', contestProblemRoutes);
app.use('/api/oauth', oauthRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serve static files from the client build directory
const clientBuildPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientBuildPath)) {
  // List of all client-side routes from App.tsx
  const clientRoutes = [
    '/',
    '/about',
    '/company',
    '/careers',
    '/press',
    '/contact',
    '/blog',
    '/community',
    '/help',
    '/privacy',
    '/terms',
    '/cookies',
    '/auth/callback',
    '/test-connection',
    '/login',
    '/register',
    '/verify-email',
    '/problems',
    '/problems/:id',
    '/contests',
    '/contests/:contestId',
    '/wallet',
    '/profile',
    '/admin',
    '/leaderboard',
    '/discuss',
    '/submissions',
    '/settings'
  ];

  // Serve static files from the client build
  app.use(express.static(clientBuildPath, {
    // Don't redirect to index.html for API routes
    index: false,
    // Enable etag for better caching
    etag: true,
    // Enable last-modified header
    lastModified: true,
    // Set max age for static assets
    maxAge: '1y'
  }));
  
  // Handle all client-side routes
  clientRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
          console.error(`Error serving route ${route}:`, err);
          res.status(500).send('Error loading the application');
        }
      });
    });
  });
  
  // Fallback for any other GET request that hasn't been handled
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // For all other routes, serve the index.html
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error loading the application');
      }
    });
  });
} else {
  // 404 handler for API routes only if client build doesn't exist
  app.all('*', (req, res) => {
    res.status(404).json({
      status: 'fail',
      message: `Can't find ${req.originalUrl} on this server!`
    });
  });
}

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  heartbeatFrequencyMS: 10000, // Send a heartbeat every 10 seconds
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Handle connection events
    mongoose.connection.on('connecting', () => {
      console.log('🔌 Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ Connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ Disconnected from MongoDB');
    });

    // Connect with retry logic
    let retries = 5;
    while (retries) {
      try {
        await mongoose.connect(config.MONGODB_URI, mongooseOptions);
        break;
      } catch (error) {
        console.error(`❌ MongoDB connection failed (${retries} retries left):`, error.message);
        retries--;
        if (retries === 0) throw error;
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const port = config.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port} in ${config.NODE_ENV} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB after retries:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});