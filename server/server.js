import express from 'express';
import { Script, createContext } from 'node:vm';
import os from 'os';
import { spawn, spawnSync, exec } from 'child_process';
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

// Simple HTML entity unescape for code payloads that may be sanitized by xss middleware
const unescapeHtml = (str = '') =>
  String(str)
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

// Safe fetch helper for Node < 18 compatibility
const getFetch = async () => {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
};

// Lazy-load TypeScript only when needed so production can run without devDependency
const loadTS = async () => {
  try {
    const mod = await import('typescript');
    return mod.default || mod;
  } catch {
    return null;
  }
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
import analyticsRoutes from './routes/analytics.js';
import blogRoutes from './routes/blog.js';
import oauthRoutes from './routes/oauth.js';
import walletRoutes from './routes/wallet.js';
import emailTestRoutes from './routes/email-test.js';
import notificationRoutes from './routes/notifications.js';
import { authenticate } from './middleware/auth.js';
import admin from './middleware/admin.js';
import Problem from './models/Problem.js';
import Submission from './models/Submission.js';
import User from './models/User.js';
import Contest from './models/Contest.js';
import { executeCode } from './utils/codeExecutor.js';
import { sendEmail } from './utils/email.js';
import { openaiChat } from './utils/ai/openai.js';
import cron from 'node-cron';
import { grantStreakRewardsDaily, grantMonthlyLeaderboardRewards } from './services/rewards.js';

// Initialize express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (prefer server/.env.local, then server/.env)
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Alias: some clients call /api/execute — route to the same handler logic as /api/code/run
app.post('/api/execute', async (req, res) => {
  try {
    const payload = req.body || {};
    const language = (payload.language || '').toString().toLowerCase();
    let source = '';
    if (typeof payload.code === 'string') source = payload.code;
    else if (typeof payload.sourceCode === 'string') source = payload.sourceCode;
    else if (Array.isArray(payload.files) && payload.files[0]?.content) source = payload.files[0].content;
    // Unescape basic HTML entities if present
    const unescapeHtmlLocal = (str = '') => String(str)
      .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
    source = unescapeHtmlLocal(source);

    if (!source || !['javascript', 'typescript', 'java', 'cpp'].includes(language)) {
      return res.status(400).json({ message: 'Only JavaScript, TypeScript, Java and C++ are supported', language, received: Object.keys(payload || {}) });
    }

    // Reuse same branches as /api/code/run
    // Java
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
        const start = Date.now();
        const startMs = Date.now();
        const child = spawn(java, ['-cp', tmpDir, 'Solution'], { stdio: ['pipe', 'pipe', 'pipe'] });
        // Sample VmRSS from /proc when available (Linux) to approximate peak memory
        let maxRssKb = 0;
        const rssTimer = setInterval(() => {
          try {
            if (child.pid && process.platform === 'linux') {
              const txt = fs.readFileSync(`/proc/${child.pid}/status`, 'utf8');
              const m = txt.match(/VmRSS:\s*(\d+)\s*kB/i);
              if (m) {
                const kb = parseInt(m[1], 10);
                if (Number.isFinite(kb) && kb > maxRssKb) maxRssKb = kb;
              }
            }
          } catch {}
        }, 60);
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdinStr = typeof payload.stdin === 'string' ? unescapeHtmlLocal(payload.stdin) : '';
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
          const timeMs = Date.now() - start;
          return res.status(200).json({ run: { output: out, stderr: err, timeMs }, timeMs });
        });
      });
      return;
    }

    // C++
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
        const start = Date.now();
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
          clearInterval(rssTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          const out = Buffer.concat(stdoutChunks).toString('utf8');
          const err = Buffer.concat(stderrChunks).toString('utf8') || (killed ? 'Time limit exceeded' : '');
          const timeMs = Date.now() - startMs;
          const memoryKb = maxRssKb || undefined;
          return res.status(200).json({ run: { output: out, stderr: err, timeMs, memoryKb }, timeMs, memoryKb });
        });
      });
      return;
    }

    // TS/JS transpile compatibility
    let code = source;
    if (language === 'typescript') {
      const ts = await loadTS();
      if (!ts) return res.status(500).json({ message: 'TypeScript compiler not available on server' });
      const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, strict: false, esModuleInterop: true } });
      code = result.outputText;
    } else if (language === 'javascript' && /(^|\s)(import\s|export\s)/.test(source)) {
      const ts = await loadTS();
      if (ts) {
        const result = ts.transpileModule(source, { compilerOptions: { allowJs: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true }, fileName: 'user_code.js' });
        code = result.outputText;
      }
    }

    const stdout = [];
    const stderr = [];
    const memBefore = process.memoryUsage().rss;
    const tStart = Date.now();
    const stdin = typeof payload.stdin === 'string' ? unescapeHtmlLocal(payload.stdin) : '';
    const inputLines = stdin.split(/\r?\n/);
    let inputIndex = 0;
    const sandbox = {
      console: { log: (...args) => stdout.push(args.map(a => String(a)).join(' ')), error: (...args) => stderr.push(args.map(a => String(a)).join(' ')), warn: (...args) => stdout.push(args.map(a => String(a)).join(' ')) },
      readLine: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      gets: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      prompt: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : ''),
      require: (name) => { if (name === 'fs') { return { readFileSync: () => stdin }; } throw new Error('Module not allowed'); },
      setTimeout, setInterval, clearTimeout, clearInterval,
    };
    const context = createContext(sandbox);
    try {
      const script = new Script(code, { filename: 'user_code.js' });
      script.runInContext(context, { timeout: 3000 });
    } catch (e) {
      stderr.push(String(e && e.message ? e.message : e));
    }
    const output = stdout.join('\n');
    const err = stderr.join('\n');
    return res.status(200).json({ success: true, stdout: output, stderr: err, output, run: { output, stderr: err } });
  } catch (err) {
    console.error('Error executing code (/api/execute):', err);
    return res.status(500).json({ message: 'Execution service error' });
  }
});
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

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

// Ensure /api/execute passes through CORS and reuses /api/code/run logic
app.use('/api/execute', (req, res, next) => {
  // Forward to the canonical handler while preserving method/body
  req.url = '/api/code/run';
  next();
});

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

// Lightweight server time endpoint for client-side clock sync
app.get('/api/time', (req, res) => {
  try {
    const now = Date.now();
    return res.status(200).json({ now, iso: new Date(now).toISOString() });
  } catch (e) {
    return res.status(200).json({ now: Date.now() });
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
    source = unescapeHtml(source);

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
        const stdinStr = typeof payload.stdin === 'string' ? unescapeHtml(payload.stdin) : '';
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
        const startMs = Date.now();
        const child = spawn(cmd, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        // Sample VmRSS for C++ as well
        let maxRssKb = 0;
        const rssTimer = setInterval(() => {
          try {
            if (child.pid && process.platform === 'linux') {
              const txt = fs.readFileSync(`/proc/${child.pid}/status`, 'utf8');
              const m = txt.match(/VmRSS:\s*(\d+)\s*kB/i);
              if (m) {
                const kb = parseInt(m[1], 10);
                if (Number.isFinite(kb) && kb > maxRssKb) maxRssKb = kb;
              }
            }
          } catch {}
        }, 60);
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

    // Transpile TS to JS if needed, and convert JS ESM import/export to CJS (best-effort)
    let code = source;
    if (language === 'typescript') {
      const ts = await loadTS();
      if (!ts) {
        return res.status(500).json({ message: 'TypeScript compiler not available on server' });
      }
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
      const ts = await loadTS();
      if (ts) {
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
    }

    const stdout = [];
    const stderr = [];
    const stdin = typeof payload.stdin === 'string' ? unescapeHtml(payload.stdin) : '';
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
      apiUrl: process.env.API_URL || 'http://localhost:5000',
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
// Apply higher-burst limiter for wallet APIs
app.use('/api/wallet', walletLimiter);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/contest-problems', contestProblemRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/email-test', emailTestRoutes); // Add email test routes
app.use('/api/notifications', notificationRoutes);

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

// Lightweight compiler endpoint for CodeEditor
// Accepts { code, input, lang } where lang is one of: 'Cpp' | 'Java' | 'Python' | 'JavaScript'
// Responds with { output, runtimeMs, exitCode }
app.post('/compile', async (req, res) => {
  try {
    const { code, input, lang } = req.body || {};
    if (typeof code !== 'string' || !lang) {
      return res.status(400).json({ output: 'Missing code or language', runtimeMs: 0, exitCode: 1 });
    }
    const start = Date.now();
    const done = (stdoutText, stderrText = '', exitCode = 0, memoryKb) => {
      const output = String(stdoutText || '') || String(stderrText || '');
      const payload = { output, stdout: String(stdoutText || ''), stderr: String(stderrText || ''), runtimeMs: Date.now() - start, exitCode };
      if (typeof memoryKb === 'number' && Number.isFinite(memoryKb)) payload.memoryKb = Math.max(0, Math.round(memoryKb));
      return res.status(200).json(payload);
    };

    // Best-effort peak memory polling for a child pid
    const createMemoryPoller = (pid) => {
      let peakKb = 0;
      const interval = setInterval(() => {
        if (!pid) return;
        if (process.platform === 'win32') {
          exec(`powershell -NoProfile -Command "(Get-Process -Id ${pid}).WorkingSet64"`, (err, stdout) => {
            if (err) return; // ignore
            const bytes = parseInt(String(stdout).trim(), 10);
            if (Number.isFinite(bytes)) {
              const kb = Math.round(bytes / 1024);
              if (kb > peakKb) peakKb = kb;
            }
          });
        } else {
          exec(`ps -o rss= -p ${pid}`, (err, stdout) => {
            if (err) return;
            const kb = parseInt(String(stdout).trim(), 10);
            if (Number.isFinite(kb) && kb > peakKb) peakKb = kb;
          });
        }
      }, 80);
      return {
        stop: () => { try { clearInterval(interval); } catch {} },
        getPeak: () => peakKb,
      };
    };

    if (lang === 'JavaScript') {
      // Execute with Node.js
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-js-'));
      const filePath = path.join(tmpDir, 'main.js');
      fs.writeFileSync(filePath, unescapeHtml(code), 'utf8');
      const child = spawn(process.execPath, [filePath], { stdio: ['pipe', 'pipe', 'pipe'] });
      const mem = createMemoryPoller(child.pid);
      if (input) child.stdin.write(String(unescapeHtml(input)));
      child.stdin.end();
      let out = '', err = '';
      let killed = false;
      const killTimer = setTimeout(() => { killed = true; try { child.kill('SIGKILL'); } catch {} }, 3000);
      child.stdout.on('data', d => (out += d.toString()));
      child.stderr.on('data', d => (err += d.toString()));
      child.on('close', (code) => {
        clearTimeout(killTimer);
        mem.stop();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        if (killed) return done('', 'Time limit exceeded', 124);
        return done(out, err, typeof code === 'number' ? code : 0, mem.getPeak());
      });
      return;
    }

    if (lang === 'Python') {
      const tmpFile = path.join(os.tmpdir(), `algobucks-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);
      fs.writeFileSync(tmpFile, unescapeHtml(code), 'utf8');
      const pythonBin = process.env.PYTHON_BIN || 'python';
      const child = spawn(pythonBin, [tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });
      const mem = createMemoryPoller(child.pid);
      if (input) child.stdin.write(String(input));
      child.stdin.end();
      let out = '', err = '';
      let killed = false;
      const killTimer = setTimeout(() => { killed = true; try { child.kill('SIGKILL'); } catch {} }, 3000);
      child.stdout.on('data', d => (out += d.toString()));
      child.stderr.on('data', d => (err += d.toString()));
      child.on('close', (code) => {
        clearTimeout(killTimer);
        try { fs.unlinkSync(tmpFile); } catch {}
        if (killed) return done('', 'Time limit exceeded', 124);
        return done(out, err, typeof code === 'number' ? code : 0, mem.getPeak());
      });
      return;
    }

    if (lang === 'Java') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-java-'));
      const srcFile = path.join(tmpDir, 'Main.java');
      fs.writeFileSync(srcFile, unescapeHtml(code), 'utf8');
      const javac = process.env.JAVAC_BIN || 'javac';
      const java = process.env.JAVA_BIN || 'java';
      const compile = spawn(javac, ['-d', tmpDir, srcFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));
      compile.on('close', (status) => {
        if (status !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return done('', err || 'Compilation failed', 1);
        }
        const child = spawn(java, ['-cp', tmpDir, 'Main'], { stdio: ['pipe', 'pipe', 'pipe'] });
        const mem = createMemoryPoller(child.pid);
        if (input) child.stdin.write(String(unescapeHtml(input)));
        child.stdin.end();
        let out = '', err = '';
        let killed = false;
        const killTimer = setTimeout(() => { killed = true; try { child.kill('SIGKILL'); } catch {} }, 3000);
        child.stdout.on('data', d => (out += d.toString()));
        child.stderr.on('data', d => (err += d.toString()));
        child.on('close', (code) => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          if (killed) return done('', 'Time limit exceeded', 124);
          return done(out, err, typeof code === 'number' ? code : 0, mem.getPeak());
        });
      });
      return;
    }

    if (lang === 'Cpp') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-cpp-'));
      const srcFile = path.join(tmpDir, 'main.cpp');
      const exeFile = path.join(tmpDir, process.platform === 'win32' ? 'a.exe' : 'a.out');
      fs.writeFileSync(srcFile, unescapeHtml(code), 'utf8');
      const gxx = process.env.GXX_BIN || 'g++';
      const compile = spawn(gxx, ['-std=c++17', '-O2', srcFile, '-o', exeFile]);
      const compileErr = [];
      compile.stderr.on('data', d => compileErr.push(d));
      compile.on('close', (status) => {
        if (status !== 0) {
          const err = Buffer.concat(compileErr).toString('utf8');
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return done('', err || 'Compilation failed', 1);
        }
        const child = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        const mem = createMemoryPoller(child.pid);
        if (input) child.stdin.write(String(input));
        child.stdin.end();
        let out = '', err = '';
        let killed = false;
        const killTimer = setTimeout(() => { killed = true; try { child.kill('SIGKILL'); } catch {} }, 3000);
        child.stdout.on('data', d => (out += d.toString()));
        child.stderr.on('data', d => (err += d.toString()));
        child.on('close', (code) => {
          clearTimeout(killTimer);
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          if (killed) return done('', 'Time limit exceeded', 124);
          return done(out, err, typeof code === 'number' ? code : 0, mem.getPeak());
        });
      });
      return;
    }

    return done('Unsupported language', 1);
  } catch (e) {
    return res.status(500).json({ output: 'error', runtimeMs: 0, exitCode: 1 });
  }
});

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

    // Execute and evaluate against full problem testcases
    const result = await executeCode(code, language, problem.testCases || [], {
      compareMode,
      ignoreWhitespace,
      ignoreCase,
    });

    // Parse numeric runtime/memory from result (best-effort)
    const parseMs = (v) => {
      if (v == null) return undefined;
      if (typeof v === 'number') return Math.round(v);
      const m = String(v).match(/([0-9]+(?:\.[0-9]+)?)\s*ms/i);
      if (m) return Math.round(parseFloat(m[1]));
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : undefined;
    };
    const parseKb = (v) => {
      if (v == null) return undefined;
      if (typeof v === 'number') return Math.round(v);
      const s = String(v);
      const mb = s.match(/([0-9]+(?:\.[0-9]+)?)\s*mb/i);
      if (mb) return Math.round(parseFloat(mb[1]) * 1024);
      const kb = s.match(/([0-9]+(?:\.[0-9]+)?)\s*kb/i);
      if (kb) return Math.round(parseFloat(kb[1]));
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : undefined;
    };
    const runtimeMs = parseMs(result?.runtime);
    const memoryKb = parseKb(result?.memory);

    const submission = new Submission({
      user: req.user._id,
      problem: problem._id,
      code,
      language,
      status: result?.status || 'Submitted',
      runtime: result?.runtime,
      memory: result?.memory,
      runtimeMs,
      memoryKb,
      testsPassed: Number(result?.testsPassed || 0),
      totalTests: Number(result?.totalTests || (problem.testCases?.length || 0)),
      score: Number(result?.score || 0),
      contest: contestId || undefined,
    });
    await submission.save();

    // Update problem statistics
    problem.submissions = (problem.submissions || 0) + 1;
    if ((result?.status || '').toLowerCase() === 'accepted') {
      problem.acceptedSubmissions = (problem.acceptedSubmissions || 0) + 1;
      if (typeof problem.updateAcceptance === 'function') {
        try { problem.updateAcceptance(); } catch {}
      }
    }
    await problem.save();

    // Award codecoin on first AC for this problem
    let earnedCodecoin = false;
    if ((result?.status || '').toLowerCase() === 'accepted') {
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

    return res.json({ submission, result: { ...(result || {}), runtimeMs, memoryKb, earnedCodecoin } });
  } catch (err) {
    console.error('Legacy /api/code/submit error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to submit code' });
  }
});

// In-house code execution for JavaScript/TypeScript using Node's vm (no external runner)
app.post('/api/execute', async (req, res) => {
  try {
    const payload = req.body || {};
    const language = (payload.language || '').toString().toLowerCase();
    const files = Array.isArray(payload.files) ? payload.files : [];
    let source = files[0]?.content ?? '';
    source = unescapeHtml(source);

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
        const mapToPiston = (lang) => {
          const l = (lang || '').toString().toLowerCase();
          if (l === 'c++' || l === 'cpp') return 'cpp';
          if (l === 'node' || l === 'nodejs' || l === 'javascript') return 'javascript';
          return l;
        };
        const pistonLang = mapToPiston(language);
        // Version is required by Piston. Prefer client-provided payload.version,
        // otherwise fall back to defaults; if missing, discover from /runtimes.
        const defaultVersions = {
          javascript: '18.15.0',
          typescript: '5.0.3',
          // Leave Python empty to trigger runtime discovery
          python: '',
          // Leave Java empty to trigger runtime discovery on the target Piston instance
          java: '',
          // Leave C++ empty to trigger runtime discovery
          cpp: '',
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

        // Final guard: ensure non-empty version string to satisfy Piston
        if (!version) {
          const fallbackVersions = {
            cpp: '10.2.0', // common gcc on public Piston
            python: '3.10.0',
            java: '17.0.0',
            typescript: '5.0.3',
            javascript: '18.15.0',
          };
          version = fallbackVersions[pistonLang] || '1.0.0';
          console.warn(`[Piston] Runtime discovery failed for ${pistonLang}. Using fallback version: ${version}`);
        }

        if (pistonLang === 'java') {
          console.log(`[Piston] Selected Java runtime version: ${version || '(auto-discovery failed)'}`);
        } else if (pistonLang === 'python') {
          console.log(`[Piston] Selected Python runtime version: ${version || '(auto-discovery failed)'}`);
        } else if (pistonLang === 'cpp') {
          console.log(`[Piston] Selected C++ runtime version: ${version || '(auto-discovery failed)'}`);
        }

        const pistonReq = {
          language: pistonLang,
          version,
          files: [{ content: source, name: files[0]?.name || 'Main.' + (pistonLang === 'cpp' ? 'cpp' : pistonLang) }],
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