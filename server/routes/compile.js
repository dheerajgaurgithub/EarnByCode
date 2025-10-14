import express from 'express';
import { executeCodeWithPiston } from '../services/piston.js';

const router = express.Router();

// Handle code execution via Piston API - Only Java, C++, Python supported
async function handleExecute(req, res) {
  try {
    const { code, language, lang, input } = req.body || {};
    const chosen = (language || lang || '').toString().toLowerCase();

    if (!code || !chosen) {
      return res.status(400).json({
        error: 'Missing required fields: code and language are required'
      });
    }

    // Validate language is supported
    const supportedLanguages = ['java', 'cpp', 'python', 'c++', 'python3', 'py'];
    if (!supportedLanguages.includes(chosen)) {
      return res.status(400).json({
        error: `Unsupported language: ${chosen}. Only Java, C++, and Python are supported.`
      });
    }

    // Execute code using Piston API
    const result = await executeCodeWithPiston(chosen, code, input || '');

    return res.status(200).json({
      output: result.output,
      stdout: result.output,
      stderr: result.error,
      exitCode: result.exitCode,
      runtimeMs: 0, // Piston doesn't provide execution time
      memoryKb: null, // Piston doesn't provide memory usage
    });
  } catch (e) {
    return res.status(502).json({
      output: '',
      stdout: '',
      stderr: String(e?.message || e),
      exitCode: 1,
      runtimeMs: 0,
      memoryKb: null
    });
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
