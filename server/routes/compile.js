import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const router = express.Router();

// Map language to Docker image and run commands
const langConfig = {
  javascript: {
    image: 'node:20-bookworm',
    filename: 'main.js',
    compile: null,
    run: (filename) => ['node', filename],
  },
  python: {
    image: 'python:3.11-slim',
    filename: 'main.py',
    compile: null,
    run: (filename) => ['python', filename],
  },
  cpp: {
    image: 'gcc:12.2.0',
    filename: 'main.cpp',
    compile: (filename) => ['bash', '-lc', `g++ -O2 -std=c++17 ${filename} -o main && echo __COMPILED__`],
    run: () => ['./main'],
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    compile: (filename) => ['bash', '-lc', `javac ${filename} && echo __COMPILED__`],
    run: () => ['java', 'Main'],
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/sdk:8.0',
    filename: 'Program.cs',
    // Create minimal csproj, build, and run
    compile: (filename) => ['bash', '-lc', `dotnet new console -n app -o app -f net8.0 --no-restore >/dev/null 2>&1 && mv ${filename} app/Program.cs && cd app && dotnet restore >/dev/null 2>&1 && dotnet build -c Release >/dev/null 2>&1 && echo __COMPILED__`],
    run: () => ['bash', '-lc', 'cd app && dotnet run -c Release --no-build'],
  },
};

function dockerCmd(image, workdir, args) {
  // Basic sandbox flags: memory, pids, networking off
  const base = [
    'docker','run','--rm',
    '--network','none',
    '--cpus','0.5',
    '--memory','256m',
    '--pids-limit','128',
    '-v', `${workdir}:/code:rw`,
    '-w','/code',
    image,
    ...args,
  ];
  return base;
}

async function runWithTimeout(command, stdinStr, timeoutMs = 3000) {
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
      resolve({ stdout: '', stderr: String(e?.message || e), exitCode: 1, runtimeMs: Date.now() - startedAt });
    });
    child.on('close', (code) => {
      if (!killed) clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 0, runtimeMs: Date.now() - startedAt });
    });

    if (typeof stdinStr === 'string' && stdinStr.length) {
      child.stdin.write(stdinStr);
    }
    try { child.stdin.end(); } catch {}
  });
}

export async function runCodeSandboxed({ code, language, input }) {
  const chosen = (language || '').toString().toLowerCase();
  const cfg = langConfig[chosen];
  if (!cfg) throw new Error('Unsupported language');

  // Prepare temp dir with code file
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ab-compile-'));
  const filename = path.join(tmp, cfg.filename);
  await fs.writeFile(filename, String(code ?? ''), 'utf8');

  // Compile if required inside Docker
  if (cfg.compile) {
    const compileArgs = dockerCmd(cfg.image, tmp, cfg.compile(cfg.filename));
    const compileRes = await runWithTimeout(compileArgs, '', 8000);
    if (compileRes.exitCode !== 0 || !/__COMPILED__/.test(compileRes.stdout)) {
      try { await fs.rm(tmp, { recursive: true, force: true }); } catch {}
      return {
        stdout: '',
        stderr: compileRes.stderr || compileRes.stdout || 'Compilation failed',
        exitCode: compileRes.exitCode,
        runtimeMs: compileRes.runtimeMs,
        memoryKb: null,
      };
    }
  }

  // Run inside Docker with stdin; wrap with /usr/bin/time and write to time.txt
  const baseRun = cfg.run(cfg.filename);
  const wrapped = ['bash','-lc', `/usr/bin/time -v -o time.txt ${baseRun.map(a=>`'${a.replace(/'/g,"'\\''")}'`).join(' ')}`];
  const runArgs = dockerCmd(cfg.image, tmp, wrapped);
  const execRes = await runWithTimeout(runArgs, String(input ?? ''), 3000);

  // Cleanup temp dir
  let memKb = null;
  let runMs = execRes.runtimeMs;
  try {
    const timeRaw = await fs.readFile(path.join(tmp, 'time.txt'), 'utf8').catch(() => '');
    if (timeRaw) {
      const m = timeRaw.match(/Maximum resident set size \(kbytes\):\s*(\d+)/i);
      if (m) memKb = parseInt(m[1], 10);
      const usr = timeRaw.match(/User time \(seconds\):\s*([\d\.]+)/i);
      const sys = timeRaw.match(/System time \(seconds\):\s*([\d\.]+)/i);
      if (usr && sys) runMs = Math.round((parseFloat(usr[1]) + parseFloat(sys[1])) * 1000);
      const el = timeRaw.match(/Elapsed \(wall clock\) time:\s*(\d+:)?(\d+):(\d+\.\d+)/i);
      if (el) {
        const hours = el[1] ? parseInt(el[1].replace(':',''),10) : 0;
        const minutes = parseInt(el[2],10);
        const seconds = parseFloat(el[3]);
        const wall = ((hours*60 + minutes)*60 + seconds)*1000;
        runMs = Math.round(wall);
      }
    }
  } catch {}
  try { await fs.rm(tmp, { recursive: true, force: true }); } catch {}

  return {
    stdout: execRes.stdout,
    stderr: execRes.stderr,
    output: execRes.stdout,
    exitCode: execRes.exitCode,
    runtimeMs: runMs,
    memoryKb: memKb,
  };
}

router.post('/', express.json({ limit: '256kb' }), async (req, res) => {
  try {
    const { code, language, lang, input } = req.body || {};
    const chosen = (language || lang || '').toString().toLowerCase();
    const result = await runCodeSandboxed({ code, language: chosen, input });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

export default router;
