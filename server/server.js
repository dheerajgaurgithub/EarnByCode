import express from 'express';
import { Script, createContext } from 'node:vm';
import os from 'os';
import { spawn, spawnSync } from 'child_process';
import ts from 'typescript';
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

// Safe fetch helper for Node < 18 compatibility
const getFetch = async () => {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
};

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

// Trust reverse proxy (Render/Heroku/NGINX) so req.protocol and req.hostname respect X-Forwarded-* headers
// This is important for constructing absolute URLs (e.g., avatarUrl) behind HTTPS proxies
app.set('trust proxy', true);

// Environment check endpoint
app.get('/api/env/check', (req, res) => {
  try {
    const check = (cmd, args) => {
      try {
        const r = spawnSync(cmd, args, { encoding: 'utf8' });
        if (r.error) return { ok: false, error: r.error.message };
        if (typeof r.status === 'number' && r.status !== 0 && !r.stdout) {
          return { ok: false, error: r.stderr || `exit ${r.status}` };
        }
        return { ok: true, stdout: (r.stdout || r.stderr || '').toString().trim() };
      } catch (e) {
        return { ok: false, error: String(e?.message || e) };
      }
    };

    const pyBin = process.env.PYTHON_BIN || 'python';
    const javaBin = process.env.JAVA_BIN || 'java';
    const javacBin = process.env.JAVAC_BIN || 'javac';
    const gxxBin = process.env.GXX_BIN || 'g++';

    const result = {
      python: check(pyBin, ['--version']),
      javac: check(javacBin, ['-version']),
      java: check(javaBin, ['-version']),
      gxx: check(gxxBin, ['--version'])
    };

    const execMode = (process.env.EXECUTOR_MODE || 'auto').toLowerCase();
    const pistonUrl = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';

    res.status(200).json({ ok: true, tools: result, executor: { mode: execMode, pistonUrl } });
  } catch (err) {
    console.error('env/check error', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// Compatibility endpoint for legacy clients expecting /api/code/run
app.post('/api/code/run', async (req, res) => {
  try {
    const payload = req.body || {};
    // Accept multiple shapes: { language, code }, { language, sourceCode }, { language, files: [{content}] }
    const language = (payload.language || '').toString().toLowerCase();
    let source = '';
    if (typeof payload.code === 'string') source = payload.code;
    else if (typeof payload.sourceCode === 'string') source = payload.sourceCode;
    else if (Array.isArray(payload.files) && payload.files[0]?.content) source = payload.files[0].content;

    // Allow Java and C++ here as well so their handlers below are reachable
    if (!source || !['javascript', 'typescript', 'java', 'cpp'].includes(language)) {
      return res.status(400).json({ message: 'Only JavaScript, TypeScript, Java and C++ are supported', language, received: Object.keys(payload || {}) });
    }

    // Java execution path
    if (language === 'java') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-java-'));
      const srcFile = path.join(tmpDir, 'Solution.java');
      fs.writeFileSync(srcFile, source, 'utf8');

      const javac = process.env.JAVAC_BIN || 'javac';
      const java = process.env.JAVA_BIN || 'java';

      const compile = spawn(javac, ['-d', tmpDir, srcFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));
      compile.on('error', (e) => {
        const errMsg = `Failed to start Java compiler (${javac}). ${e?.code === 'ENOENT' ? 'javac not found in PATH. Install JDK or set JAVAC_BIN.' : String(e?.message || e)}`;
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return res.status(200).json({ run: { output: '', stderr: errMsg } });
      });

      compile.on('close', (code) => {
        if (code !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(200).json({ run: { output: '', stderr: err } });
        }

        const child = spawn(java, ['-cp', tmpDir, 'Solution'], { stdio: ['pipe', 'pipe', 'pipe'] });
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
        if (stdinStr) child.stdin.write(stdinStr);
        child.stdin.end();

        let killed = false;
        const killTimer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, 3000);

        child.stdout.on('data', d => stdoutChunks.push(d));
        child.stderr.on('data', d => stderrChunks.push(d));
        child.on('error', (e) => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const errMsg = `Failed to start Java runtime (${java}). ${e?.code === 'ENOENT' ? 'java not found in PATH. Install JRE/JDK or set JAVA_BIN.' : String(e?.message || e)}`;
          return res.status(200).json({ run: { output: '', stderr: errMsg } });
        });
        child.on('close', () => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const out = Buffer.concat(stdoutChunks).toString('utf8');
          const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
          return res.status(200).json({ run: { output: out, stderr: err } });
        });
      });
      return;
    }

    // C++ execution path
    if (language === 'cpp') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-cpp-'));
      const srcFile = path.join(tmpDir, 'main.cpp');
      fs.writeFileSync(srcFile, source, 'utf8');
      const exeFile = path.join(tmpDir, process.platform === 'win32' ? 'a.exe' : 'a.out');

      const gxx = process.env.GXX_BIN || 'g++';
      const compile = spawn(gxx, ['-std=c++17', '-O2', srcFile, '-o', exeFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));
      compile.on('error', (e) => {
        const errMsg = `Failed to start C++ compiler (${gxx}). ${e?.code === 'ENOENT' ? 'g++ not found in PATH. Install MinGW-w64/LLVM or set GXX_BIN.' : String(e?.message || e)}`;
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return res.status(200).json({ run: { output: '', stderr: errMsg } });
      });
      compile.on('close', (code) => {
        if (code !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(200).json({ run: { output: '', stderr: err } });
        }

        const cmd = process.platform === 'win32' ? exeFile : exeFile;
        const child = spawn(cmd, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
        if (stdinStr) child.stdin.write(stdinStr);
        child.stdin.end();

        let killed = false;
        const killTimer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, 3000);

        child.stdout.on('data', d => stdoutChunks.push(d));
        child.stderr.on('data', d => stderrChunks.push(d));
        child.on('close', () => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const out = Buffer.concat(stdoutChunks).toString('utf8');
          const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
          return res.status(200).json({ run: { output: out, stderr: err } });
        });
      });
      return;
    }

    // Transpile TS to JS if needed, and convert JS ESM import/export to CJS
    let code = source;
    if (language === 'typescript') {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2019,
          strict: false,
          esModuleInterop: true,
        },
      });
      code = result.outputText;
    } else if (language === 'javascript' && /(^|\s)(import\s|export\s)/.test(source)) {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          allowJs: true,
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2019,
          esModuleInterop: true,
        },
        fileName: 'user_code.js'
      });
      code = result.outputText;
    }

    const stdout = [];
    const stderr = [];
    const stdin = typeof payload.stdin === 'string' ? payload.stdin : '';
    const inputLines = stdin.split(/\r?\n/);
    let inputIndex = 0;
    const sandbox = {
      console: {
        log: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
        error: (...args) => stderr.push(args.map(a => String(a)).join(' ')),
        warn: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
      },
      readLine: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      gets: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      prompt: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      require: (name) => {
        if (name === 'fs') {
          return {
            readFileSync: () => stdin,
          };
        }
        throw new Error('Module not allowed');
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
    };
    const context = createContext(sandbox);

    try {
      const script = new Script(code, { filename: 'user_code.js' });
      script.runInContext(context, { timeout: 3000 });
    } catch (e) {
      stderr.push(String(e && e.message ? e.message : e));
    }

    // Provide a broad response structure for compatibility
    const output = stdout.join('\n');
    const err = stderr.join('\n');
    return res.status(200).json({
      success: true,
      stdout: output,
      stderr: err,
      output,
      run: { output, stderr: err },
    });
  } catch (err) {
    console.error('Error executing code (/api/code/run):', err);
    return res.status(500).json({ message: 'Execution service error' });
  }
});

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
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'x-application',
    'x-csrf-token',
    'x-requested-with'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Total-Count',
    'x-application'
  ],
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
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
      connectSrc: ["'self'", 'https://algobucks.onrender.com', 'http://localhost:5000', 'https://algobucks-tau.vercel.app'],
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

// Serve static files from the public directory
app.use(express.static(publicPath, staticOptions));

// Note: Avatar uploads and /uploads static serving have been removed.

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

// In-house code execution for JavaScript/TypeScript using Node's vm (no external runner)
app.post('/api/execute', async (req, res) => {
  try {
    const payload = req.body || {};
    const language = (payload.language || '').toString().toLowerCase();
    const files = Array.isArray(payload.files) ? payload.files : [];
    const source = files[0]?.content ?? '';

    if (!source || !['javascript', 'typescript', 'python', 'java', 'cpp'].includes(language)) {
      return res.status(400).json({
        message: 'Only JavaScript, TypeScript, Python, Java and C++ are supported',
      });
    }

    // Optional: remote execution via Piston for production or when toolchains are unavailable
    const EXECUTOR_MODE = process.env.EXECUTOR_MODE || 'auto'; // 'auto' | 'piston'
    const PISTON_URL = (process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute').trim();
    if (EXECUTOR_MODE === 'piston') {
      try {
        // Map our language ids to Piston languages if needed
        const pistonLang = language === 'cpp' ? 'cpp' : language;
        // Version is required by Piston. Prefer client-provided payload.version,
        // otherwise fall back to defaults; if missing, discover from /runtimes.
        const defaultVersions = {
          javascript: '18.15.0',
          typescript: '5.0.3',
          python: '3.11.2',
          java: '17.0.1',
          cpp: '10.2.0',
        };
        let version = (typeof payload.version === 'string' && payload.version) || defaultVersions[pistonLang] || '';
        if (!version) {
          try {
            const httpFetch = await getFetch();
            const runtimesUrl = PISTON_URL.replace(/\/execute$/, '/runtimes');
            const rr = await httpFetch(runtimesUrl);
            const runtimes = await rr.json();
            const match = Array.isArray(runtimes) ? runtimes.find(r => r.language === pistonLang) : null;
            if (match && typeof match.version === 'string') {
              version = match.version;
            }
          } catch (e) {
            // ignore discovery errors, will attempt request and report error if needed
          }
        }

        const pistonReq = {
          language: pistonLang,
          version,
          files: [{ content: source, name: files[0]?.name || 'Main.' + (language === 'cpp' ? 'cpp' : language) }],
          stdin: typeof payload.stdin === 'string' ? payload.stdin : ''
        };
        const httpFetch = await getFetch();
        const r = await httpFetch(PISTON_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pistonReq),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => '');
          return res.status(200).json({ run: { output: '', stderr: `Remote executor error (${r.status}): ${text}` } });
        }
        const data = await r.json();
        // Piston v2 returns { run: { stdout, stderr } } OR top-level outputs (depending on instance)
        const out = data?.run?.stdout ?? data?.stdout ?? '';
        const err = data?.run?.stderr ?? data?.stderr ?? '';
        return res.status(200).json({ run: { output: String(out), stderr: String(err) } });
      } catch (e) {
        return res.status(200).json({ run: { output: '', stderr: `Remote executor failed: ${String(e?.message || e)}` } });
      }
    }

    // Python execution path
    if (language === 'python') {
      const tmpFile = path.join(os.tmpdir(), `algobucks-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);
      fs.writeFileSync(tmpFile, source, 'utf8');
      const pythonBin = process.env.PYTHON_BIN || 'python';

      const child = spawn(pythonBin, [tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });
      const stdoutChunks = [];
      const stderrChunks = [];
      const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
      if (stdinStr) child.stdin.write(stdinStr);
      child.stdin.end();

      let killed = false;
      const killTimer = setTimeout(() => {
        killed = true;
        child.kill('SIGKILL');
      }, 3000);

      child.stdout.on('data', (d) => stdoutChunks.push(d));
      child.stderr.on('data', (d) => stderrChunks.push(d));
      child.on('error', (e) => {
        clearTimeout(killTimer);
        try { fs.unlinkSync(tmpFile); } catch {}
        const errMsg = `Failed to start Python interpreter (${pythonBin}). ${e?.code === 'ENOENT' ? 'Interpreter not found in PATH. Set PYTHON_BIN in .env.' : String(e?.message || e)}`;
        return res.status(200).json({ run: { output: '', stderr: errMsg } });
      });

      child.on('close', (code) => {
        clearTimeout(killTimer);
        try { fs.unlinkSync(tmpFile); } catch {}
        const out = Buffer.concat(stdoutChunks).toString('utf8');
        const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
        return res.status(200).json({
          run: { output: out, stderr: err }
        });
      });
      return; // ensure not to continue to JS path
    }

    // Java execution path
    if (language === 'java') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-java-'));
      const srcFile = path.join(tmpDir, 'Solution.java');
      fs.writeFileSync(srcFile, source, 'utf8');

      const javac = process.env.JAVAC_BIN || 'javac';
      const java = process.env.JAVA_BIN || 'java';

      const compile = spawn(javac, ['-d', tmpDir, srcFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));

      compile.on('close', (code) => {
        if (code !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(200).json({ run: { output: '', stderr: err } });
        }

        const child = spawn(java, ['-cp', tmpDir, 'Solution'], { stdio: ['pipe', 'pipe', 'pipe'] });
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
        if (stdinStr) child.stdin.write(stdinStr);
        child.stdin.end();

        let killed = false;
        const killTimer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, 3000);

        child.stdout.on('data', d => stdoutChunks.push(d));
        child.stderr.on('data', d => stderrChunks.push(d));
        child.on('close', () => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const out = Buffer.concat(stdoutChunks).toString('utf8');
          const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
          return res.status(200).json({ run: { output: out, stderr: err } });
        });
      });
      return;
    }

    // C++ execution path
    if (language === 'cpp') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-cpp-'));
      const srcFile = path.join(tmpDir, 'main.cpp');
      fs.writeFileSync(srcFile, source, 'utf8');
      const exeFile = path.join(tmpDir, process.platform === 'win32' ? 'a.exe' : 'a.out');

      const gxx = process.env.GXX_BIN || 'g++';
      const compile = spawn(gxx, ['-std=c++17', '-O2', srcFile, '-o', exeFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));
      compile.on('close', (code) => {
        if (code !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(200).json({ run: { output: '', stderr: err } });
        }

        const child = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
        if (stdinStr) child.stdin.write(stdinStr);
        child.stdin.end();

        let killed = false;
        const killTimer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, 3000);

        child.stdout.on('data', d => stdoutChunks.push(d));
        child.stderr.on('data', d => stderrChunks.push(d));
        child.on('close', () => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const out = Buffer.concat(stdoutChunks).toString('utf8');
          const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
          return res.status(200).json({ run: { output: out, stderr: err } });
        });
      });
      return;
    }

    // Transpile TS to JS if needed
    let code = source;
    if (language === 'typescript') {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2019,
          strict: false,
          esModuleInterop: true,
        },
      });
      code = result.outputText;
    }

    const stdout = [];
    const stderr = [];
    const stdin = typeof payload.stdin === 'string' ? payload.stdin : '';
    const inputLines = stdin.split(/\r?\n/);
    let inputIndex = 0;

    // Create a sandboxed context with limited globals and captured console
    const sandbox = {
      console: {
        log: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
        error: (...args) => stderr.push(args.map(a => String(a)).join(' ')),
        warn: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
      },
      readLine: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      gets: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      prompt: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      require: (name) => {
        if (name === 'fs') {
          return {
            readFileSync: () => stdin,
          };
        }
        throw new Error('Module not allowed');
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
    };
    const context = createContext(sandbox);

    try {
      const script = new Script(code, { filename: 'user_code.js' });
      script.runInContext(context, { timeout: 3000 });
    } catch (e) {
      stderr.push(String(e && e.message ? e.message : e));
    }

    return res.status(200).json({
      run: {
        output: stdout.join('\n'),
        stderr: stderr.join('\n'),
      },
    });
  } catch (err) {
    console.error('Error executing code:', err);
    return res.status(500).json({ message: 'Execution service error' });
  }
});

// Compatibility endpoint for code execution
app.post('/api/code/run', async (req, res) => {
  try {
    const payload = req.body || {};
    const language = (payload.language || '').toString().toLowerCase();
    const files = Array.isArray(payload.files) ? payload.files : [];
    const source = files[0]?.content ?? payload.code ?? '';

    if (!source || !['javascript', 'typescript', 'python', 'java', 'cpp'].includes(language)) {
      return res.status(400).json({
        message: 'Only JavaScript, TypeScript, Python, Java and C++ are supported',
      });
    }

    if (language === 'python') {
      const tmpFile = path.join(os.tmpdir(), `algobucks-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);
      fs.writeFileSync(tmpFile, source, 'utf8');
      const pythonBin = process.env.PYTHON_BIN || 'python';

      const child = spawn(pythonBin, [tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });
      const stdoutChunks = [];
      const stderrChunks = [];
      const stdinStr = typeof payload.stdin === 'string' ? payload.stdin : '';
      if (stdinStr) child.stdin.write(stdinStr);
      child.stdin.end();

      let killed = false;
      const killTimer = setTimeout(() => {
        killed = true;
        child.kill('SIGKILL');
      }, 3000);

      child.stdout.on('data', (d) => stdoutChunks.push(d));
      child.stderr.on('data', (d) => stderrChunks.push(d));

      child.on('close', (code) => {
        clearTimeout(killTimer);
        try { fs.unlinkSync(tmpFile); } catch {}
        const out = Buffer.concat(stdoutChunks).toString('utf8');
        const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
        return res.status(200).json({
          run: { output: out, stderr: err }
        });
      });
      return;
    }

    // Transpile TS to JS if needed
    let code = source;
    if (language === 'typescript') {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2019,
          strict: false,
          esModuleInterop: true,
        },
      });
      code = result.outputText;
    }

    const stdout = [];
    const stderr = [];

    // Create a sandboxed context with limited globals and captured console
    const sandbox = {
      console: {
        log: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
        error: (...args) => stderr.push(args.map(a => String(a)).join(' ')),
        warn: (...args) => stdout.push(args.map(a => String(a)).join(' ')),
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
    };
    const context = createContext(sandbox);

    try {
      const script = new Script(code, { filename: 'user_code.js' });
      script.runInContext(context, { timeout: 3000 });
    } catch (e) {
      stderr.push(String(e && e.message ? e.message : e));
    }

    return res.status(200).json({
      run: {
        output: stdout.join('\n'),
        stderr: stderr.join('\n'),
      },
    });
  } catch (err) {
    console.error('Error executing code:', err);
    return res.status(500).json({ message: 'Execution service error' });
  }
});

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