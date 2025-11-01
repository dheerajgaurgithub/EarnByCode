import express from 'express';
import { jdoodleExecute, jdoodleLanguages } from '../services/jdoodle.js';

const router = express.Router();

// POST /api/jdoodle/run
router.post('/run', express.json({ limit: '256kb' }), async (req, res) => {
  try {
    const { code, language, stdin = '', versionIndex } = req.body || {};

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing required fields: code and language' });
    }

    const result = await jdoodleExecute({ code, language, stdin, versionIndex });

    return res.status(200).json({
      output: result.stdout,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      raw: result.raw,
    });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: String(e.message || e) });
  }
});

// GET /api/jdoodle/languages
router.get('/languages', async (req, res) => {
  try {
    const data = await jdoodleLanguages();
    return res.status(200).json(data);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: String(e.message || e) });
  }
});

export default router;
