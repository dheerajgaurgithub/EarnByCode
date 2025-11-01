import express from 'express';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
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
import analyticsRoutes from './routes/analytics.js';
import blogRoutes from './routes/blog.js';
import oauthRoutes from './routes/oauth.js';
import walletRoutes from './routes/wallet.js';
import emailTestRoutes from './routes/email-test.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { authenticate } from './middleware/auth.js';
import admin from './middleware/admin.js';
import Problem from './models/Problem.js';
import Submission from './models/Submission.js';
import User from './models/User.js';
import Contest from './models/Contest.js';
import ChatThread from './models/ChatThread.js';
import ChatMessage from './models/ChatMessage.js';
import cron from 'node-cron';
import { grantStreakRewardsDaily, grantMonthlyLeaderboardRewards } from './services/rewards.js';

// Initialize express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (prefer server/.env.local, then server/.env)
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Trust the first proxy (Render/NGINX) so req.protocol and req.hostname respect X-Forwarded-* headers
// Do NOT set to true (all) to avoid permissive trust proxy issues
app.set('trust proxy', 1);

// --- Robust CORS setup (must be BEFORE routes and sessions) ---
const VERCEL =  'https://earnbycode-ebc.vercel.app'
const CORS_ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';
const allowedOrigins = [
  'http://localhost:5173',
  VERCEL,
  'https://earnbycode-ebc.vercel.app',
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);
const isAllowedOrigin = (origin) => {
  if (CORS_ALLOW_ALL) return true;
  if (!origin) return true; // same-origin/non-browser
  if (allowedOrigins.includes(origin)) return true;
  try {
    const u = new URL(origin);
    // Allow any Vercel preview/domain by default
    if (u.hostname.endsWith('.vercel.app')) return true;
  } catch {}
  return false;
};

const dynamicCors = cors({
  origin: CORS_ALLOW_ALL ? true : function (origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','x-application','X-Application','x-debug-key','X-Debug-Key'],
  exposedHeaders: ['Content-Type','Content-Length'],
  maxAge: 600,
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (CORS_ALLOW_ALL || (origin && isAllowedOrigin(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-application, X-Application, x-debug-key, X-Debug-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(dynamicCors);
app.options('*', dynamicCors);

// Middleware
app.use(helmet());

// Important: Razorpay webhook needs raw body for signature verification
app.use('/api/payments/razorpay/webhook', express.raw({ type: '*/*' }));

// General parsers
// Core middleware
app.use(express.json({ limit: '2mb' }));
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Rate limit high-risk routes
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests/10min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);
app.use('/api/users/me/bank', authLimiter);
app.use('/api/analytics/faq', rateLimit({ windowMs: 60 * 1000, max: 120 }));
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
// Global limiter (skip wallet endpoints to allow their own limiter)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  message: 'Too many requests from this IP, please try again in an hour!',
  skip: (req) => {
    try {
      // When mounted at /api, req.path begins with '/wallet/...'
      const p = String(req.path || '');
      return p.startsWith('/wallet');
    } catch { return false; }
  },
});
app.use('/api', limiter);

// Dedicated wallet limiter: allow higher burst, shorter window
const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 120,            // up to 120 req/min per IP for wallet endpoints
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Serve static files from the public directory
app.use(express.static(publicPath, staticOptions));

// Root health/redirect route
app.get('/', (req, res) => {
  try {
    const fe = process.env.FRONTEND_URL || '';
    // Redirect only if FRONTEND_URL is configured and is NOT localhost
    if (fe && !/^https?:\/\/localhost(?::\d+)?\/?$/i.test(fe)) {
      return res.redirect(302, fe);
    }
    return res.status(200).json({
      status: 'ok',
      service: 'earnbycode API',
      env: process.env.NODE_ENV || 'development',
      apiUrl: process.env.API_URL || 'https://earnbycode-mfs3.onrender.com',
      time: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(200).json({ status: 'ok' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', admin, adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/contest-problems', contestProblemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/wallet', walletLimiter, walletRoutes);
app.use('/api/email-test', emailTestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// --- Rewards: admin triggers for testing ---
app.post('/api/admin/rewards/run-daily', authenticate, admin, async (req, res) => {
  try {
    const r = await grantStreakRewardsDaily();
    return res.status(200).json({ success: true, result: r });
  } catch (e) {
    return res.status(500).json({ success: false, message: String(e?.message || e) });
  }
});

app.post('/api/admin/rewards/run-monthly', authenticate, admin, async (req, res) => {
  try {
    const { year, month } = req.body || {};
    const y = typeof year === 'number' ? year : undefined;
    const m = typeof month === 'number' ? month : undefined;
    const r = await grantMonthlyLeaderboardRewards(y, m);
    return res.status(200).json({ success: true, result: r });
  } catch (e) {
    return res.status(500).json({ success: false, message: String(e?.message || e) });
  }
});

// --- Rewards: scheduled jobs ---
try {
  // Daily at 00:10 UTC: grant streak rewards for thresholds
  cron.schedule('10 0 * * *', async () => {
    try { await grantStreakRewardsDaily(); } catch (e) { console.error('cron daily rewards error:', e); }
  }, { timezone: 'UTC' });

  // Monthly on 1st at 00:20 UTC: grant previous month leaderboard rewards
  cron.schedule('20 0 1 * *', async () => {
    try { await grantMonthlyLeaderboardRewards(); } catch (e) { console.error('cron monthly rewards error:', e); }
  }, { timezone: 'UTC' });
} catch (e) {
  console.error('Failed to schedule rewards cron:', e);
}

// AI Chat endpoint (OpenAI-first). Supports streaming via SSE.
app.post('/api/ai/chat', async (req, res) => {
  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const model = body.model;
    const stream = body.stream !== false; // default true
    const temperature = typeof body.temperature === 'number' ? body.temperature : undefined;
    const max_tokens = typeof body.max_tokens === 'number' ? body.max_tokens : undefined;

    if (!messages.length) {
      return res.status(400).json({ message: 'messages[] is required' });
    }

    if (!stream) {
      const result = await openaiChat({ messages, model, temperature, max_tokens, stream: false });
      return res.status(200).json({ provider: result.provider, model: result.model, content: result.content });
    }

    // Streaming mode: set SSE headers and pipe upstream chunks
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const controller = new AbortController();
    const { stream: upstream } = await openaiChat({ messages, model, temperature, max_tokens, stream: true, signal: controller.signal });

    const onClose = () => {
      try { controller.abort(); } catch {}
      try { upstream?.destroy?.(); } catch {}
      try { res.end(); } catch {}
    };
    req.on('close', onClose);

    upstream.on('data', (chunk) => {
      try {
        res.write(chunk);
      } catch (_) {
        onClose();
      }
    });
    upstream.on('end', () => {
      try { res.end(); } catch {}
    });
    upstream.on('error', () => {
      try { res.end(); } catch {}
    });
  } catch (e) {
    return res.status(500).json({ message: String(e?.message || e) });
  }
});

// Backward-compatible aliases for legacy OAuth path (/api/auth/* -> /api/oauth/*)
app.get('/api/auth/google', (req, res) => {
  const qsIndex = req.originalUrl.indexOf('?');
  const qs = qsIndex >= 0 ? req.originalUrl.slice(qsIndex) : '';
  return res.redirect(302, `/api/oauth/google${qs}`);
});
app.get('/api/auth/google/callback', (req, res) => {
  const qsIndex = req.originalUrl.indexOf('?');
  const qs = qsIndex >= 0 ? req.originalUrl.slice(qsIndex) : '';
  return res.redirect(302, `/api/oauth/google/callback${qs}`);
});

// Debug endpoint: expose current OAuth-related config (safe values only)
app.get('/api/debug/oauth-config', (req, res) => {
  try {
    return res.status(200).json({
      apiUrl: config.API_URL,
      frontendUrl: config.FRONTEND_URL,
      googleClientId: config.GOOGLE_CLIENT_ID,
      callbackUrl: `${config.API_URL}/api/oauth/google/callback`,
    });
  } catch (e) {
    return res.status(200).json({ error: true });
  }
});

// --- Press Live Updates (SSE) ---
// Simple in-memory feed and SSE broadcaster to support the Press page live updates
const pressClients = new Set(); // each item is an Express Response
let pressFeed = [];

// Seed with a couple of items
pressFeed = [
  {
    id: String(Date.now() - 60000),
    type: 'status',
    title: 'Press feed initialized',
    message: 'Welcome to AlgoBucks live press updates!',
    source: 'AlgoBucks',
    timestamp: Date.now() - 60000,
  },
  {
    id: String(Date.now() - 30000),
    type: 'press',
    title: 'AlgoBucks featured in TechDaily',
    message: 'Our new contests platform covered by TechDaily.',
    source: 'TechDaily',
    url: 'https://example.com/article',
    timestamp: Date.now() - 30000,
  },
];

// GET recent press items
app.get('/api/press', (req, res) => {
  try {
    const since = req.query.since;
    if (since) {
      const sinceTs = isNaN(Number(since)) ? Date.parse(String(since)) : Number(since);
      const filtered = pressFeed.filter((it) => Number(it.timestamp) > Number(sinceTs));
      return res.status(200).json(filtered.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)));
    }
    const recent = [...pressFeed].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 50);
    return res.status(200).json(recent);
  } catch (e) {
    return res.status(200).json([]);
  }
});

// SSE stream
app.get('/api/press/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Notify client of retry interval
  res.write('retry: 10000\n\n');

  // Send a hello message
  res.write(`data: ${JSON.stringify({ id: String(Date.now()), type: 'status', message: 'connected', timestamp: Date.now() })}\n\n`);

  pressClients.add(res);

  req.on('close', () => {
    try { pressClients.delete(res); } catch {}
    try { res.end(); } catch {}
  });
});

// Simple manual injection endpoint (optional) to push a new press item
app.post('/api/press', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const item = {
      id: String(body.id || Date.now()),
      type: String(body.type || 'press'),
      title: body.title || undefined,
      message: String(body.message || ''),
      source: body.source || 'AlgoBucks',
      url: body.url || undefined,
      timestamp: Number(body.timestamp || Date.now()),
    };
    pressFeed.unshift(item);
    // Broadcast to all clients
    const payload = `data: ${JSON.stringify(item)}\n\n`;
    for (const client of pressClients) {
      try { client.write(payload); } catch {}
    }
    return res.status(200).json({ ok: true, item });
  } catch (e) {
    return res.status(400).json({ ok: false });
  }
});

// Demo ticker (can be disabled by setting PRESS_DEMO_STREAM=off)
if ((process.env.PRESS_DEMO_STREAM || 'on').toLowerCase() !== 'off') {
  setInterval(() => {
    const demo = {
      id: String(Date.now()),
      type: 'mention',
      title: 'Social mention',
      message: 'AlgoBucks mentioned in a developer forum thread.',
      source: 'Community',
      url: undefined,
      timestamp: Date.now(),
    };
    pressFeed.unshift(demo);
    pressFeed = pressFeed.slice(0, 200);
    const payload = `data: ${JSON.stringify(demo)}\n\n`;
    for (const client of pressClients) {
      try { client.write(payload); } catch {}
    }
  }, 30000);
}

// Legacy /compile endpoint - REMOVED (now uses compile.js route)
// app.post('/compile', ...);

// Legacy compatibility: handle older clients posting to /api/code/submit
// Mirrors the behavior of POST /api/problems/:id/submit
app.post('/api/code/submit', authenticate, async (req, res) => {
  try {
    const { problemId, code, language, contestId } = req.body || {};
    if (!problemId || typeof code !== 'string' || typeof language !== 'string') {
      return res.status(400).json({ status: 'fail', message: 'problemId, code and language are required' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ status: 'fail', message: 'Problem not found' });
    }

    // Optional contest validation (lightweight)
    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (!contest) {
        return res.status(404).json({ status: 'fail', message: 'Contest not found' });
      }
      if (!contest.problems?.some?.(p => p.toString() === String(problemId))) {
        return res.status(400).json({ status: 'fail', message: 'Problem not part of contest' });
      }
      const now = new Date();
      if (now < new Date(contest.startTime) || now > new Date(contest.endTime)) {
        return res.status(403).json({ status: 'fail', message: 'Contest is not active' });
      }
      const isParticipant = (contest.participants || []).some(p => String(p.user || p) === String(req.user._id));
      if (!isParticipant) {
        return res.status(403).json({ status: 'fail', message: 'Not a contest participant' });
      }
    }

    // Determine comparison options: default relaxed; allow strict per problem/contest or env
    const compareMode = (
      (problem && (problem.comparisonMode || problem.compareMode || problem?.settings?.comparison)) ||
      (typeof contest !== 'undefined' && contest && (contest.comparisonMode || contest.compareMode || contest?.settings?.comparison)) ||
      process.env.COMPARISON_MODE ||
      'relaxed'
    ).toString().toLowerCase();

    const ignoreWhitespace = compareMode === 'strict' ? false : true;
    const ignoreCase = compareMode === 'strict' ? false : true;

    // Execute and evaluate against full problem testcases using sandboxed runner
    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    let testsPassed = 0;
    const totalTests = testCases.length;
    let anyCompileErr = false;
    let anyRuntimeErr = false;
    let anyTLE = false;
    let aggRuntimeMs = 0;
    let peakMemoryKb = 0;

    const langKey = (language || '').toString().toLowerCase();
    // Validate language is supported
    const supportedLanguages = ['java', 'cpp', 'python', 'c++', 'python3', 'py'];
    if (!supportedLanguages.includes(langKey)) {
      return res.status(400).json({ status: 'fail', message: `Unsupported language: ${language}. Only Java, C++, and Python are supported.` });
    }
    const normalizeOut = (s) => {
      let t = (s ?? '').toString().replace(/\r\n/g, '\n');
      if (ignoreWhitespace) t = t.replace(/\s+/g, ' ').trim(); else t = t.trim();
      if (ignoreCase) t = t.toLowerCase();
      return t;
    };

    for (const tc of testCases) {
      const input = tc.input ?? tc.stdin ?? '';
      const expected = normalizeOut(tc.expectedOutput ?? tc.expected ?? '');
      const resp = await executeCodeWithPiston(langKey, code, input);
      const exit = typeof resp.exitCode === 'number' ? resp.exitCode : 0;
      if (exit === 124) anyTLE = true;
      if (exit !== 0 && exit !== 124) anyRuntimeErr = true;
      if (resp.stderr && /compil|javac|g\+\+|error:/i.test(resp.stderr)) anyCompileErr = true;
      const actual = normalizeOut(resp.stdout ?? resp.output ?? '');
      if (expected ? (actual === expected) : (exit === 0)) testsPassed += 1;
      if (typeof resp.runtimeMs === 'number') aggRuntimeMs += Math.max(0, resp.runtimeMs);
      if (typeof resp.memoryKb === 'number') peakMemoryKb = Math.max(peakMemoryKb, resp.memoryKb);
    }

    let status = 'Wrong Answer';
    if (anyCompileErr) status = 'Compilation Error';
    else if (anyTLE) status = 'Time Limit Exceeded';
    else if (anyRuntimeErr && testsPassed === 0) status = 'Runtime Error';
    else if (testsPassed === totalTests) status = 'Accepted';
    else if (testsPassed > 0) status = 'Partial Correct';

    const runtimeMs = aggRuntimeMs || undefined;
    const memoryKb = peakMemoryKb || undefined;

    const submission = new Submission({
      user: req.user._id,
      problem: problem._id,
      code,
      language,
      status,
      runtime: runtimeMs ? `${runtimeMs}ms` : undefined,
      memory: memoryKb ? `${Math.round(memoryKb/1024)}MB` : undefined,
      runtimeMs,
      memoryKb,
      testsPassed: testsPassed,
      totalTests: totalTests,
      score: totalTests > 0 ? Math.floor((testsPassed / totalTests) * 100) : 0,
      contest: contestId || undefined,
    });
    await submission.save();

    // Update problem statistics
    problem.submissions = (problem.submissions || 0) + 1;
    if (status.toLowerCase() === 'accepted') {
      problem.acceptedSubmissions = (problem.acceptedSubmissions || 0) + 1;
      if (typeof problem.updateAcceptance === 'function') {
        try { problem.updateAcceptance(); } catch {}
      }
    }
    await problem.save();

    // Award codecoin on first AC for this problem
    let earnedCodecoin = false;
    if (status.toLowerCase() === 'accepted') {
      const u = await User.findById(req.user._id);
      const alreadySolved = (u?.solvedProblems || []).some(p => String(p) === String(problem._id));
      if (!alreadySolved) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { solvedProblems: problem._id },
          $inc: { codecoins: 1, points: 10 },
        });
        earnedCodecoin = true;
      }
    }

    return res.json({ submission, result: { status, testsPassed, totalTests, runtimeMs, memoryKb, score: totalTests > 0 ? Math.floor((testsPassed/totalTests)*100) : 0, earnedCodecoin } });
  } catch (err) {
    console.error('Legacy /api/code/submit error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to submit code' });
  }
});

// Legacy /api/execute endpoint - REMOVED (now uses Piston API only)
// app.post('/api/execute', ...);

// Add performance monitoring middleware
app.use(performanceMonitoringMiddleware);

// Enhanced health check endpoint
app.get('/api/health', healthCheckWithMetrics);

// Performance dashboard endpoint
app.get('/api/performance', performanceDashboard);

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

  app.use(express.static(clientBuildPath, {
    index: false,
    etag: true,
    lastModified: true,
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

// MongoDB connection options (compatible defaults)
const isSrv = typeof config.MONGODB_URI === 'string' && config.MONGODB_URI.startsWith('mongodb+srv://');
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Handle connection events
    mongoose.connection.on('connecting', () => {
      console.log('🔌 Connecting to MongoDB...');
      console.log(`   • SRV URI: ${isSrv}`);
      console.log(`   • NODE_ENV: ${config.NODE_ENV}`);
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

    // --- Socket.IO: realtime presence ---
    const io = new IOServer(server, {
      path: '/socket.io',
      cors: {
        origin: (origin, cb) => {
          try {
            // Reuse existing CORS allow logic
            const ok = !origin || origin === undefined || origin === null || true; // fallback; detailed check below
            if (ok || (origin && (origin.endsWith('.vercel.app') || origin.includes('localhost')))) return cb(null, true);
          } catch {}
          return cb(null, true);
        },
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Expose io to routes
    app.set('io', io);

    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
    const online = new Map(); // userId -> { sockets: Set<string>, lastSeen: Date, online: boolean }
    const watchers = new Map(); // targetUserId -> Set<socketId>

    const emitPresence = (userId) => {
      const entry = online.get(userId);
      const payload = {
        userId: String(userId),
        online: !!(entry && entry.lastSeen && (Date.now() - new Date(entry.lastSeen).getTime() < ONLINE_THRESHOLD_MS)),
        lastSeen: entry?.lastSeen ? new Date(entry.lastSeen).toISOString() : null,
      };
      const targets = watchers.get(String(userId));
      if (targets && targets.size) {
        for (const sid of targets) {
          try { io.to(sid).emit('presence:update', payload); } catch {}
        }
      }
    };

    io.use((socket, next) => {
      try {
        const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.replace(/^Bearer\s+/i,'');
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_KEY || 'secret');
          socket.data.userId = decoded.id || decoded._id || decoded.sub;
        }
      } catch {}
      return next();
    });

    io.on('connection', (socket) => {
      const sid = socket.id;
      // Identify current user explicitly
      socket.on('presence:identify', ({ userId } = {}) => {
        const uid = String(userId || socket.data.userId || '');
        if (!uid) return;
        socket.data.userId = uid; // ensure future pings/disconnect map to this user
        // join per-user room
        try { socket.join(`user:${uid}`); } catch {}
        let entry = online.get(uid);
        if (!entry) entry = { sockets: new Set(), lastSeen: new Date(), online: true };
        entry.sockets.add(sid);
        entry.lastSeen = new Date();
        entry.online = true;
        online.set(uid, entry);
        emitPresence(uid);
      });

      socket.on('presence:ping', () => {
        const uid = socket.data.userId ? String(socket.data.userId) : null;
        if (!uid) return;
        const entry = online.get(uid);
        if (entry) {
          entry.lastSeen = new Date();
          entry.online = true;
          online.set(uid, entry);
        }
      });

      socket.on('presence:watch', ({ userIds } = {}) => {
        const ids = Array.isArray(userIds) ? userIds.map(String) : [];
        for (const id of ids) {
          if (!watchers.has(id)) watchers.set(id, new Set());
          watchers.get(id).add(sid);
          // send immediate snapshot
          const entry = online.get(id);
          socket.emit('presence:update', {
            userId: String(id),
            online: !!entry?.online && (entry.lastSeen ? (Date.now() - new Date(entry.lastSeen).getTime() < ONLINE_THRESHOLD_MS) : false),
            lastSeen: entry?.lastSeen ? new Date(entry.lastSeen).toISOString() : null,
          });
        }
      });

      socket.on('disconnect', () => {
        // remove from online maps
        const uid = socket.data.userId ? String(socket.data.userId) : null;
        if (uid) {
          const entry = online.get(uid);
          if (entry) {
            entry.sockets.delete(sid);
            if (entry.sockets.size === 0) {
              entry.online = false;
              entry.lastSeen = new Date();
            }
            online.set(uid, entry);
            emitPresence(uid);
          }
        }
        // remove from watchers
        for (const set of watchers.values()) {
          set.delete(sid);
        }
      });
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