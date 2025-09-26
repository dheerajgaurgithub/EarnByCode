import express from 'express';
import AnalyticsFAQ, { normalizeQuestion } from '../models/AnalyticsFAQ.js';
import AnalyticsFAQHit from '../models/AnalyticsFAQHit.js';

const router = express.Router();

// POST /api/analytics/faq
// body: { question: string }
router.post('/faq', async (req, res) => {
  try {
    const { question } = req.body || {};
    const q = normalizeQuestion(question || '');
    if (!q) return res.status(400).json({ ok: false, message: 'question required' });

    const updated = await AnalyticsFAQ.findOneAndUpdate(
      { question: q },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    // Also log a hit for date-range analytics
    try { await AnalyticsFAQHit.create({ question: q }); } catch {}

    return res.json({ ok: true, item: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'failed to log', error: String(e?.message || e) });
  }
});

// POST /api/analytics/faq/feedback
// body: { question: string, vote: 'up' | 'down' }
router.post('/faq/feedback', async (req, res) => {
  try {
    const { question, vote } = req.body || {};
    const q = normalizeQuestion(question || '');
    if (!q || (vote !== 'up' && vote !== 'down')) {
      return res.status(400).json({ ok: false, message: 'invalid payload' });
    }
    const inc = vote === 'up' ? { helpfulUp: 1 } : { helpfulDown: 1 };
    const updated = await AnalyticsFAQ.findOneAndUpdate(
      { question: q },
      { $inc: inc },
      { new: true, upsert: true }
    );
    return res.json({ ok: true, item: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'failed to record feedback', error: String(e?.message || e) });
  }
});

// GET /api/analytics/faq/top?limit=10
router.get('/faq/top', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const sinceDays = Number(req.query.sinceDays || 0);
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    // If a date filter is supplied, aggregate from hits collection
    if (sinceDays > 0 || from || to) {
      const match = {};
      const now = new Date();
      let start = from instanceof Date && !isNaN(from) ? from : null;
      let end = to instanceof Date && !isNaN(to) ? to : null;
      if (sinceDays > 0) {
        start = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);
      }
      if (start) match.createdAt = Object.assign({}, match.createdAt, { $gte: start });
      if (end) match.createdAt = Object.assign({}, match.createdAt, { $lte: end });

      const pipeline = [
        Object.keys(match).length ? { $match: match } : null,
        { $group: { _id: '$question', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { _id: 0, question: '$_id', count: 1 } },
      ].filter(Boolean);

      const items = await AnalyticsFAQHit.aggregate(pipeline);
      return res.json({ ok: true, items });
    }

    // Otherwise use the aggregated totals collection
    const items = await AnalyticsFAQ.find({}).sort({ count: -1 }).limit(limit).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'failed to fetch', error: String(e?.message || e) });
  }
});

export default router;
