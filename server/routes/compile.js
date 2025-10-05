import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// Minimal HTML entity unescape for sanitized code
function unescapeHtml(str = '') {
  return String(str)
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

// Minimal fetch shim for Node < 18
async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

// Judge0 language mapping
function mapJudge0Language(lang) {
  const l = String(lang || '').toLowerCase();
  const ids = {
    javascript: Number(process.env.JUDGE0_ID_JS || 63),
    python: Number(process.env.JUDGE0_ID_PY || 71),
    java: Number(process.env.JUDGE0_ID_JAVA || 62),
    cpp: Number(process.env.JUDGE0_ID_CPP || 54),
    c: Number(process.env.JUDGE0_ID_C || 50),
    csharp: Number(process.env.JUDGE0_ID_CS || 51),
    ruby: Number(process.env.JUDGE0_ID_RUBY || 72),
    go: Number(process.env.JUDGE0_ID_GO || 60),
    rust: Number(process.env.JUDGE0_ID_RUST || 73),
    php: Number(process.env.JUDGE0_ID_PHP || 68),
  };

  if (l === 'javascript' || l === 'js' || l === 'node' || l === 'nodejs') return ids.javascript;
  if (l === 'python' || l === 'py' || l === 'python3') return ids.python;
  if (l === 'java') return ids.java;
  if (l === 'cpp' || l === 'c++') return ids.cpp;
  if (l === 'c') return ids.c;
  if (l === 'csharp' || l === 'cs' || l === 'c#') return ids.csharp;
  if (l === 'ruby' || l === 'rb') return ids.ruby;
  if (l === 'go' || l === 'golang') return ids.go;
  if (l === 'rust' || l === 'rs') return ids.rust;
  if (l === 'php') return ids.php;

  return null;
}

// Judge0 executor
export async function runViaJudge0({ code, language, input }) {
  const f = await getFetch();
  const host = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
  const base = process.env.JUDGE0_BASE || `https://${host}`;
  const key = process.env.JUDGE0_KEY;

  if (!key) {
    throw new Error('JUDGE0_KEY environment variable is not set');
  }

  const language_id = mapJudge0Language(language);
  if (!language_id) {
    return {
      stdout: '',
      stderr: `Unsupported language for Judge0: ${language}`,
      exitCode: 1,
      runtimeMs: 0,
      memoryKb: null
    };
  }

  const url = `${base}/submissions?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory,exit_code&wait=true`;
  const body = {
    source_code: unescapeHtml(String(code || '')),
    language_id,
    stdin: String(input || '')
  };

  try {
    const resp = await f(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      throw new Error(`Judge0 API error: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json().catch(() => ({}));
    const status = data?.status?.id || 0;
    const stdout = typeof data?.stdout === 'string' ? data.stdout : '';
    const stderr = typeof data?.stderr === 'string' ? data.stderr :
                   (typeof data?.compile_output === 'string' ? data.compile_output :
                   (typeof data?.message === 'string' ? data.message : ''));
    const exitCode = typeof data?.exit_code === 'number' ? data.exit_code : (status === 3 ? 0 : 1);
    const runtimeMs = data?.time ? Math.round(parseFloat(String(data.time)) * 1000) : 0;
    const memoryKb = typeof data?.memory === 'number' ? data.memory : null;

    return { stdout, stderr, output: stdout, exitCode, runtimeMs, memoryKb };
  } catch (error) {
    throw new Error(`Judge0 execution failed: ${error.message}`);
  }
}

// Language configurations for Docker execution
const langConfig = {
  javascript: {
    image: process.env.NODE_IMAGE || 'node:20-slim',
    filename: 'main.js',
    compile: null,
    run: (filename) => ['node', filename],
  },
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
  c: {
    image: process.env.C_IMAGE || 'gcc:12.2.0',
    filename: 'main.c',
    compile: (filename) => ['bash', '-c', `gcc -O2 ${filename} -o main && echo __COMPILED__`],
    run: () => ['./main'],
  },
  java: {
    image: process.env.JAVA_IMAGE || 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    compile: (filename) => ['bash', '-c', `javac -J-Djava.security.egd=file:/dev/./urandom -d . ${filename} && echo __COMPILED__`],
    run: () => ['java', '-Djava.security.egd=file:/dev/./urandom', '-Xms16m', '-Xmx256m', '-XX:+UseSerialGC', '-cp', '.', 'Main'],
  },
  csharp: {
    image: process.env.DOTNET_IMAGE || 'mcr.microsoft.com/dotnet/sdk:8.0',
    filename: 'Program.cs',
    compile: (filename) => ['bash', '-c', `dotnet new console -n app -o app -f net8.0 --no-restore >/dev/null 2>&1 && mv ${filename} app/Program.cs && cd app && dotnet restore >/dev/null 2>&1 && dotnet build -c Release >/dev/null 2>&1 && echo __COMPILED__`],
    run: () => ['bash', '-c', 'cd app && dotnet run -c Release --no-build'],
  },
  ruby: {
    image: process.env.RUBY_IMAGE || 'ruby:3.2-slim',
    filename: 'main.rb',
    compile: null,
    run: (filename) => ['ruby', filename],
  },
  go: {
    image: process.env.GO_IMAGE || 'golang:1.21-alpine',
    filename: 'main.go',
    compile: (filename) => ['bash', '-c', `go build -o main ${filename} && echo __COMPILED__`],
    run: () => ['./main'],
  },
  rust: {
    image: process.env.RUST_IMAGE || 'rust:1.75-slim',
    filename: 'main.rs',
    compile: (filename) => ['bash', '-c', `rustc -O ${filename} -o main && echo __COMPILED__`],
    run: () => ['./main'],
  },
  php: {
    image: process.env.PHP_IMAGE || 'php:8.2-cli-alpine',
    filename: 'main.php',
    compile: null,
    run: (filename) => ['php', filename],
  },
};

// Normalize language names
function normalizeLanguage(lang) {
  const l = String(lang || '').toLowerCase().trim();

  if (l === 'javascript' || l === 'js' || l === 'node' || l === 'nodejs') return 'javascript';
  if (l === 'python' || l === 'py' || l === 'python3') return 'python';
  if (l === 'java') return 'java';
  if (l === 'cpp' || l === 'c++') return 'cpp';
  if (l === 'c') return 'c';
  if (l === 'csharp' || l === 'cs' || l === 'c#') return 'csharp';
  if (l === 'ruby' || l === 'rb') return 'ruby';
  if (l === 'go' || l === 'golang') return 'go';
  if (l === 'rust' || l === 'rs') return 'rust';
  if (l === 'php') return 'php';

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

// Check Docker availability with caching
let _dockerOk = null;
let _dockerCheckedAt = 0;

export async function isDockerAvailable() {
  const now = Date.now();
  if (_dockerOk !== null && (now - _dockerCheckedAt) < 60_000) {
    return _dockerOk;
  }

  try {
    const res = await runWithTimeout(['docker', '--version'], '', 2000);
    _dockerOk = res.exitCode === 0 && /version/i.test(res.stdout || '');
  } catch {
    _dockerOk = false;
  }

  _dockerCheckedAt = now;
  return _dockerOk;
}

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
    const source = unescapeHtml(String(code ?? ''));

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

