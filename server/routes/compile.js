import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
const router = express.Router();

// HTML entity unescape for sanitized code - REMOVED (only used for Judge0)
// function unescapeHtml(str = '') {

// Minimal fetch shim for Node < 18 - REMOVED (only used for Judge0)
// async function getFetch() {

// Judge0 language mapping - REMOVED
// function mapJudge0Language(lang) {

// Judge0 executor - REMOVED
// export async function runViaJudge0({ code, language, input }) {

// Shared handler
async function handleExecute(req, res) {
  try {
    const { code, language, lang, input } = req.body || {};
    const chosen = (language || lang || '').toString().toLowerCase();

    const mode = 'docker'; // Docker mode is now the only supported execution mode
    if (mode === 'judge0') {
      // Judge0 mode removed - only Docker mode supported now
      return res.status(503).json({
        status: 'unavailable',
        message: 'Judge0 API integration has been removed. Please use Docker mode.'
      });
    }

    // Docker mode is hardcoded - no availability check needed
    // Removed: const hasDocker = await isDockerAvailable();

    const result = await runCodeSandboxed({ code, language: chosen, input });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// HTTP routes expected by server and client
router.post('/', express.json({ limit: '256kb' }), (req, res) => {
  handleExecute(req, res);
});
router.post('/execute', express.json({ limit: '256kb' }), (req, res) => {
  handleExecute(req, res);
});

export default router;

// Language configurations for Docker execution - only Java, C++, Python
const langConfig = {
  python: {
    image: process.env.PY_IMAGE || 'python:3.11-slim',
    filename: 'main.py',
    compile: null,
    run: (filename) => ['python', filename],
  },
  cpp: {
    image: process.env.CPP_IMAGE || 'gcc:12.2.0',
    filename: 'main.cpp',
    compile: (filename) => ['bash', '-c', `g++ -O2 -std=c++17 ${filename} -o main && echo __COMPILED__`],
    run: () => ['./main'],
  },
  java: {
    image: process.env.JAVA_IMAGE || 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    compile: (filename) => ['bash', '-c', `javac -J-Djava.security.egd=file:/dev/./urandom -d . ${filename} && echo __COMPILED__`],
    run: () => ['java', '-Djava.security.egd=file:/dev/./urandom', '-Xms16m', '-Xmx256m', '-XX:+UseSerialGC', '-cp', '.', 'Main'],
  },
};

// Normalize language names - only Java, C++, Python supported
function normalizeLanguage(lang) {
  const l = String(lang || '').toLowerCase().trim();

  if (l === 'java') return 'java';
  if (l === 'cpp' || l === 'c++') return 'cpp';
  if (l === 'python' || l === 'py' || l === 'python3') return 'python';

  return null;
}

// Build Docker command
function dockerCmd(image, workdir, args, limits = {}) {
  const cpus = limits.cpus ?? '1.0';
  const memory = limits.memory ?? '512m';
  const pids = limits.pids ?? '256';

  return [
    'docker', 'run', '--rm',
    '--network', 'none',
    '--cpus', String(cpus),
    '--memory', String(memory),
    '--pids-limit', String(pids),
    '-v', `${workdir}:/code:rw`,
    '-w', '/code',
    image,
    ...args,
  ];
}

// Run command with timeout
async function runWithTimeout(command, stdinStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command[0], command.slice(1), { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      try { child.kill('SIGKILL'); } catch {}
      resolve({
        stdout: '',
        stderr: 'Time limit exceeded',
        exitCode: 124,
        runtimeMs: Date.now() - startedAt,
      });
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: `Execution error: ${e.message}`,
        exitCode: 1,
        runtimeMs: Date.now() - startedAt
      });
    });

    child.on('close', (code) => {
      if (!killed) clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
        runtimeMs: Date.now() - startedAt
      });
    });

    if (typeof stdinStr === 'string' && stdinStr.length) {
      try {
        child.stdin.write(stdinStr);
      } catch {}
    }
    try { child.stdin.end(); } catch {}
  });
}

// Docker availability check - REMOVED (hardcoded to Docker mode)
// export async function isDockerAvailable() {

// Main Docker-based code executor
export async function runCodeSandboxed({ code, language, input }) {
  const normalized = normalizeLanguage(language);
  if (!normalized) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const cfg = langConfig[normalized];
  if (!cfg) {
    throw new Error(`Configuration missing for language: ${normalized}`);
  }

  // Create temp directory
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'code-exec-'));

  try {
    let filename = path.join(tmp, cfg.filename);
    let detectedJavaClass = null;
    const source = String(code ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // Handle Java class detection
    if (normalized === 'java') {
      const m = source.match(/public\s+class\s+(\w+)/);
      detectedJavaClass = m ? m[1] : 'Main';
      filename = path.join(tmp, `${detectedJavaClass}.java`);
    }

    await fs.writeFile(filename, source, 'utf8');

    // Write stdin input
    const inputStr = String(input ?? '');
    const stdinFile = path.join(tmp, 'stdin.txt');
    await fs.writeFile(stdinFile, inputStr, 'utf8');

    // Compilation step if needed
    if (cfg.compile) {
      const compileTarget = path.basename(filename);
      const compileArgs = dockerCmd(cfg.image, tmp, cfg.compile(compileTarget));
      const compileRes = await runWithTimeout(compileArgs, '', 15000);

      if (compileRes.exitCode !== 0 || !/__COMPILED__/.test(compileRes.stdout)) {
        return {
          stdout: '',
          stderr: compileRes.stderr || compileRes.stdout || 'Compilation failed',
          output: '',
          exitCode: compileRes.exitCode,
          runtimeMs: compileRes.runtimeMs,
          memoryKb: null,
        };
      }
    }

    // Warmup for Java (one-time)
    if (normalized === 'java' && !global.__ab_java_warm__) {
      try {
        const warmCmd = ['bash', '-c', `echo 'class _W{public static void main(String[]a){}}' > _W.java && javac -J-Djava.security.egd=file:/dev/./urandom -d . _W.java && java -Djava.security.egd=file:/dev/./urandom -cp . _W`];
        const warmArgs = dockerCmd(cfg.image, os.tmpdir(), warmCmd);
        await runWithTimeout(warmArgs, '', 15000);
      } catch {}
      global.__ab_java_warm__ = true;
    }

    // Execution
    let baseRun = cfg.run(cfg.filename);
    if (normalized === 'java' && detectedJavaClass) {
      baseRun = ['java', '-Djava.security.egd=file:/dev/./urandom', '-Xms16m', '-Xmx256m', '-XX:+UseSerialGC', '-cp', '.', detectedJavaClass];
    }

    const wrapped = ['bash', '-c', `/usr/bin/time -v -o time.txt ${baseRun.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')} < stdin.txt`];
    let runArgs = dockerCmd(cfg.image, tmp, wrapped);
    const execTimeout = (normalized === 'java') ? 15000 : 8000;
    let execRes = await runWithTimeout(runArgs, '', execTimeout);

    // Fallback if /usr/bin/time not available
    if (execRes.exitCode === 127 && /time:\s+not found|No such file or directory/i.test(execRes.stderr || '')) {
      const plain = ['bash', '-c', `${baseRun.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')} < stdin.txt`];
      runArgs = dockerCmd(cfg.image, tmp, plain);
      execRes = await runWithTimeout(runArgs, '', execTimeout);
    }

    // Parse timing info
    let memKb = null;
    let runMs = execRes.runtimeMs;

    try {
      const timeRaw = await fs.readFile(path.join(tmp, 'time.txt'), 'utf8').catch(() => '');
      if (timeRaw) {
        const m = timeRaw.match(/Maximum resident set size \(kbytes\):\s*(\d+)/i);
        if (m) memKb = parseInt(m[1], 10);

        const usr = timeRaw.match(/User time \(seconds\):\s*([\d\.]+)/i);
        const sys = timeRaw.match(/System time \(seconds\):\s*([\d\.]+)/i);
        if (usr && sys) {
          runMs = Math.round((parseFloat(usr[1]) + parseFloat(sys[1])) * 1000);
        }
      }
    } catch {}

    return {
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      output: execRes.stdout,
      exitCode: execRes.exitCode,
      runtimeMs: runMs,
      memoryKb: memKb,
    };
  } finally {
    // Cleanup
    try {
      await fs.rm(tmp, { recursive: true, force: true });
    } catch {}
  }
}

