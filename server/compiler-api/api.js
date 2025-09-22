const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compiler = require('compilex');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// Initialize
const app = express();
compiler.init({ stats: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Compile endpoint
app.post('/compile', async (req, res) => {
  const { code, input, lang } = req.body || {};
  try {
    if (!code || !lang) return res.status(400).send({ output: 'Missing code or language' });

    const start = Date.now();
    const done = (payload) => {
      const runtimeMs = Date.now() - start;
      res.send({ runtimeMs, exitCode: payload.exitCode ?? (payload.output ? 0 : 1), output: payload.output ?? '' });
    };

    if (lang === 'Cpp') {
      const envData = { OS: 'windows', cmd: 'g++', options: { timeout: 10000 } };
      if (!input) {
        compiler.compileCPP(envData, code, (data) => done({ output: data?.output }));
      } else {
        compiler.compileCPPWithInput(envData, code, input, (data) => done({ output: data?.output }));
      }
    } else if (lang === 'Java') {
      const envData = { OS: 'windows' };
      if (!input) {
        compiler.compileJava(envData, code, (data) => done({ output: data?.output }));
      } else {
        compiler.compileJavaWithInput(envData, code, input, (data) => done({ output: data?.output }));
      }
    } else if (lang === 'Python') {
      const envData = { OS: 'windows' };
      if (!input) {
        compiler.compilePython(envData, code, (data) => done({ output: data?.output }));
      } else {
        compiler.compilePythonWithInput(envData, code, input, (data) => done({ output: data?.output }));
      }
    } else if (lang === 'JavaScript') {
      // Execute with Node.js directly
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algobucks-js-'));
      const filePath = path.join(tmpDir, 'main.js');
      fs.writeFileSync(filePath, code, 'utf8');
      const child = spawn('node', [filePath], { stdio: ['pipe', 'pipe', 'pipe'] });
      if (input) {
        child.stdin.write(String(input));
      }
      child.stdin.end();
      let out = '';
      let err = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (err += d.toString()));
      child.on('close', (code) => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        done({ output: out || err, exitCode: code ?? 0 });
      });
    } else {
      res.status(400).send({ output: 'Unsupported language' });
    }
  } catch (e) {
    console.error('compile error', e);
    res.status(500).send({ output: 'error' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Compiler API listening on http://localhost:${PORT}`);
});
