import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import Submission from '../../models/Submission.js';
import { submitCode, submitCodeBatch, getExecutionResult, executeCode } from '../../services/onlineGDBService.js';
import { increment } from '../../services/metrics.js';

const router = express.Router();

// Rate limiters (per-IP)
const runLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
const resultLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// List submissions for current user with basic pagination
router.get('/', authenticate, async (req, res) => {
  try {
    increment('api_v2_submissions_list');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.problemId) query.problem = req.query.problemId;
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.language && req.query.language !== 'all') query.language = String(req.query.language).toLowerCase();

    const [items, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-code')
        .lean(),
      Submission.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error('List submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to list submissions' });
  }
});

// Get a single submission by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    increment('api_v2_submissions_get');
    const doc = await Submission.findById(req.params.id)
      .select('-code')
      .populate('problem', 'title difficulty')
      .lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(doc.user) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission' });
  }
});

// Problem-specific submissions (current user)
router.get('/problem/:problemId', authenticate, async (req, res) => {
  try {
    increment('api_v2_submissions_problem');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));
    const skip = (page - 1) * limit;
    const query = { user: req.user._id, problem: req.params.problemId };
    const [items, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('status language runtime memory testsPassed totalTests createdAt')
        .lean(),
      Submission.countDocuments(query)
    ]);
    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Problem submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to list problem submissions' });
  }
});

// Submit code (requires auth, creates a Submission)
router.post('/submit', authenticate, submitLimiter, async (req, res) => {
  try {
    const { problemId, code, language, contestId, input } = req.body || {};
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: 'problemId, code and language are required' });
    }
    const result = await submitCode({
      userId: req.user._id,
      problemId,
      code,
      language,
      contestId,
      input: typeof input === 'string' ? input : ''
    });
    res.status(202).json({ success: true, data: result });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to submit code' });
  }
});

// Run code (no auth, no Submission document)
router.post('/run', runLimiter, async (req, res) => {
  try {
    const { code, language, input } = req.body || {};
    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'code and language are required' });
    }
    increment('api_v2_submissions_run');
    const result = await executeCode(code, language, typeof input === 'string' ? input : '');
    res.status(202).json({ success: true, data: result });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to run code' });
  }
});

// Poll execution result (public; sessionId is unguessable UUID)
router.get('/result/:sessionId', resultLimiter, async (req, res) => {
  try {
    increment('api_v2_submissions_result');
    const result = await getExecutionResult(req.params.sessionId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ success: false, message: 'Failed to get result' });
  }
});

// Batch submit: server executes all testcases and aggregates results
router.post('/submit/batch', authenticate, submitLimiter, async (req, res) => {
  try {
    const { problemId, code, language, contestId, compareMode } = req.body || {};
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: 'problemId, code and language are required' });
    }
    increment('api_v2_submissions_submit_batch');
    const result = await submitCodeBatch({ userId: req.user._id, problemId, code, language, contestId, compareMode });
    res.status(202).json({ success: true, data: result });
  } catch (error) {
    console.error('Submit batch error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to submit batch' });
  }
});

export default router;
