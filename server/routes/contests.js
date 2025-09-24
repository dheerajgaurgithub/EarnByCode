import express from 'express';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Clarification from '../models/Clarification.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';

const router = express.Router();

// Get all contests
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    // Only show public contests by default
    let query = { isPublic: true };
    if (status && status !== 'all') {
      query.status = status;
    }

    const contests = await Contest.find(query)
      .populate('createdBy', 'username')
      .populate('problems', 'title difficulty')
      .sort({ startTime: -1 });

// Contest results with custom ranking metric
// average = (submissionTimeMs + runTimeMs + compileTimeMs) / 3
// - submissionTimeMs: min time delta from contest start to a user's submission
// - runTimeMs: average parsed runtime from Submission.runtime (best effort)
// - compileTimeMs: 0 unless tracked; placeholder for future
// Ties share the same rank. Supports search and pagination.
router.get('/:id/results', async (req, res) => {
  try {
    const contestId = req.params.id;
    const { search = '', page = 1, limit = 50 } = req.query;
    const p = Math.max(1, parseInt(page));
    const lim = Math.min(200, Math.max(1, parseInt(limit)));

    const contest = await Contest.findById(contestId).populate('participants.user', 'username').lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    // Fetch submissions once for this contest
    const subs = await Submission.find({ contest: contestId })
      .populate('user', 'username')
      .lean();

    const parseMs = (val) => {
      if (val == null) return 0;
      if (typeof val === 'number') return val;
      const s = String(val);
      const m = s.match(/(\d+(?:\.\d+)?)/);
      return m ? Math.round(parseFloat(m[1])) : 0; // assume ms
    };

    // Group submissions by user
    const byUser = new Map();
    for (const s of subs) {
      const uid = String(s.user?._id || s.user);
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(s);
    }

    // Build base list from participants to include users without submissions
    const rows = [];
    for (const part of contest.participants || []) {
      const uid = String(part.user?._id || part.user);
      const username = part.user?.username || String(part.user);
      const list = byUser.get(uid) || [];

      // Submission time: min delta from contest start to submission createdAt
      let submissionTimeMs = Infinity;
      for (const s of list) {
        const created = new Date(s.createdAt);
        const delta = Math.max(0, created.getTime() - start.getTime());
        if (delta < submissionTimeMs) submissionTimeMs = delta;
      }
      if (!isFinite(submissionTimeMs)) submissionTimeMs = Math.max(0, end.getTime() - start.getTime());

      // Run time: average of parsed runtime across submissions
      let runSum = 0;
      let runCount = 0;
      for (const s of list) {
        const ms = parseMs(s.runtime);
        if (ms > 0) { runSum += ms; runCount += 1; }
      }
      const runTimeMs = runCount > 0 ? Math.round(runSum / runCount) : 0;

      // Compile time placeholder (not tracked); keep 0 for now
      const compileTimeMs = 0;

      const average = Math.round((submissionTimeMs + runTimeMs + compileTimeMs) / 3);
      rows.push({ userId: uid, username, submissionTimeMs, runTimeMs, compileTimeMs, average });
    }

    // Sort by average asc
    rows.sort((a, b) => a.average - b.average);

    // Assign ranks with ties (same average => same rank)
    let rank = 0;
    let lastAvg = null;
    let count = 0;
    for (const r of rows) {
      count += 1;
      if (lastAvg === null || r.average !== lastAvg) {
        rank = count;
        lastAvg = r.average;
      }
      r.rank = rank;
    }

    // Search filter by username
    let filtered = rows;
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtered = rows.filter(r => rx.test(r.username || ''));
    }

    const total = filtered.length;
    const startIdx = (p - 1) * lim;
    const pageItems = filtered.slice(startIdx, startIdx + lim);

    // Mark top 10 for star display
    const topTenCutoff = Math.min(10, rows.length);
    const topTenRanks = new Set(rows.slice(0, topTenCutoff).map(r => r.userId));
    for (const r of pageItems) r.topTen = topTenRanks.has(r.userId);

    return res.json({
      total,
      page: p,
      pages: Math.ceil(total / lim),
      results: pageItems,
    });
  } catch (error) {
    console.error('Results error:', error);
    return res.status(500).json({ message: 'Failed to fetch results' });
  }
});

    res.json({ contests });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
});

// Get single contest
// Get contest feedback
router.get('/:id/feedback', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .select('feedbacks averageRating feedbackCount')
      .populate('feedbacks.user', 'username');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json({
      feedbacks: contest.feedbacks,
      averageRating: contest.averageRating,
      feedbackCount: contest.feedbackCount
    });
  } catch (error) {
    console.error('Get contest feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch contest feedback' });
  }
});

// Submit contest feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if contest is completed
    if (contest.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed contests' });
    }

    // Check if user participated in the contest
    const participant = contest.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({ message: 'Only participants can submit feedback' });
    }

    await contest.addFeedback(req.user._id, rating, comment);
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      averageRating: contest.averageRating,
      feedbackCount: contest.feedbackCount
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Get user's feedback for a contest
router.get('/:id/feedback/me', authenticate, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const feedback = contest.getUserFeedback(req.user._id);
    res.json({ feedback });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch user feedback' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('problems')
      .populate('participants.user', 'username')
      .populate('feedbacks.user', 'username');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json({ contest });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ message: 'Failed to fetch contest' });
  }
});

// Join contest
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const contestId = req.params.id;
    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if contest is joinable
    if (contest.status !== 'upcoming') {
      return res.status(400).json({ message: 'Contest registration is closed' });
    }

    // Check if already joined
    const alreadyJoined = contest.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: 'Already registered for this contest' });
    }

    // Check minimum wallet balance rule (₹10)
    if (req.user.walletBalance < 10) {
      return res.status(400).json({ message: 'Minimum wallet balance required is ₹10' });
    }
    // Check wallet balance for entry fee
    if (req.user.walletBalance < contest.entryFee) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check max participants
    if (contest.participants.length >= contest.maxParticipants) {
      return res.status(400).json({ message: 'Contest is full' });
    }

    // Deduct entry fee and get updated balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { walletBalance: -contest.entryFee },
        $addToSet: { contestsParticipated: contestId }
      },
      { new: true }
    );

    // Add participant to contest
    contest.participants.push({
      user: req.user._id,
      score: 0,
      solvedProblems: [],
      rank: 0,
      prize: 0,
      pointsEarned: 0
    });

    await contest.save();

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      type: 'contest_entry',
      amount: -contest.entryFee,
      currency: 'INR',
      description: `Entry fee for ${contest.title}`,
      status: 'completed',
      fee: 0,
      netAmount: -contest.entryFee,
      balanceAfter: updatedUser?.walletBalance ?? 0,
      contest: contestId
    });

    await transaction.save();

    res.json({ message: 'Successfully joined contest' });
  } catch (error) {
    console.error('Join contest error:', error);
    res.status(500).json({ message: 'Failed to join contest' });
  }
});

// Get contest leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('participants.user', 'username')
      .select('participants title status');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const leaderboard = contest.participants
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.solvedProblems[a.solvedProblems.length - 1]?.solvedAt || 0) - 
               new Date(b.solvedProblems[b.solvedProblems.length - 1]?.solvedAt || 0);
      })
      .map((participant, index) => ({
        ...participant.toObject(),
        rank: index + 1
      }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Settle a contest: credit winners and admin remainder
router.post('/:id/settle', authenticate, admin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const contestId = req.params.id;
    const contest = await Contest.findById(contestId).session(session);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Ensure contest is completed
    if (contest.status !== 'completed') {
      contest.status = 'completed';
      await contest.save({ session });
    }

    // Compute totals
    const participants = contest.participants || [];
    const totalCollected = Number(contest.entryFee || 0) * participants.length;

    // If prizes not distributed yet, compute via prizeDistribution
    if (!participants.some(p => p.prize > 0) && contest.prizePool > 0) {
      contest.updateRankings();
      contest.distributePrizes();
      await contest.save({ session });
    }

    const winners = participants.filter(p => (p.prize || 0) > 0);
    const totalPrizes = winners.reduce((sum, p) => sum + Number(p.prize || 0), 0);
    const remainder = Math.max(0, totalCollected - totalPrizes);

    // Credit winners
    for (const w of winners) {
      const prize = Number(w.prize || 0);
      if (prize <= 0) continue;
      const user = await User.findById(w.user).session(session);
      if (!user) continue;
      user.walletBalance = parseFloat((user.walletBalance + prize).toFixed(2));
      await user.save({ session });
      const txn = new Transaction({
        user: user._id,
        type: 'contest_prize',
        amount: prize,
        currency: 'INR',
        description: `Prize for contest ${contest.title}`,
        status: 'completed',
        fee: 0,
        netAmount: prize,
        balanceAfter: user.walletBalance,
        contest: contest._id
      });
      await txn.save({ session });
    }

    // Credit admin with remainder
    if (remainder > 0) {
      const adminUser = await User.findOne({ isAdmin: true }).session(session);
      if (adminUser) {
        adminUser.walletBalance = parseFloat((adminUser.walletBalance + remainder).toFixed(2));
        await adminUser.save({ session });
        const adminTxn = new Transaction({
          user: adminUser._id,
          type: 'adjustment',
          amount: remainder,
          currency: 'INR',
          description: `Contest remainder for ${contest.title}`,
          status: 'completed',
          fee: 0,
          netAmount: remainder,
          balanceAfter: adminUser.walletBalance,
          contest: contest._id
        });
        await adminTxn.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    return res.json({
      message: 'Contest settled successfully',
      totals: { totalCollected, totalPrizes, remainder }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Settle contest error:', error);
    return res.status(500).json({ message: 'Failed to settle contest' });
  }
});

// Auto-submit (called on unload). Marks participant as exited/autoSubmitted.
router.post('/:id/auto-submit', authenticate, async (req, res) => {
  try {
    const contestId = req.params.id;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }
    // Update participant flags (non-destructive; adds fields if missing)
    await Contest.updateOne(
      { _id: contestId, 'participants.user': req.user._id },
      {
        $set: {
          'participants.$.autoSubmitted': true,
          'participants.$.exitedAt': new Date(),
        }
      }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Auto-submit error:', error);
    return res.status(200).json({ success: true }); // best-effort, never block unload
  }
});

// Clarifications placeholder to prevent 500 if feature not wired
// List clarifications (public to participants; admin can see all)
router.get('/:id/clarifications', authenticate, async (req, res) => {
  try {
    const contestId = req.params.id;
    const isAdmin = req.user?.isAdmin === true || req.user?.role === 'admin';
    const query = { contest: contestId };
    // If not admin, hide private clarifications not by the user
    if (!isAdmin) {
      query.$or = [
        { isPrivate: false },
        { user: req.user._id },
      ];
    }
    const list = await Clarification.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'username')
      .populate('answeredBy', 'username')
      .lean();
    return res.json({ clarifications: list });
  } catch (error) {
    console.error('List clarifications error:', error);
    return res.status(500).json({ message: 'Failed to fetch clarifications' });
  }
});

// Ask a clarification (must be a participant of the contest)
router.post('/:id/clarifications', authenticate, async (req, res) => {
  try {
    const contestId = req.params.id;
    const { question, isPrivate, visibility = 'all', tags = [] } = req.body || {};
    if (!question || String(question).trim().length < 3) {
      return res.status(400).json({ message: 'Question is too short' });
    }
    const contest = await Contest.findById(contestId).select('participants status');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    // Must be participant
    const isParticipant = (contest.participants || []).some((p) => String(p?.user || p) === String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Only participants can ask clarifications' });
    // Rate limit: 1 per minute per user per contest
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await Clarification.findOne({
      contest: contestId,
      user: req.user._id,
      createdAt: { $gte: oneMinuteAgo },
    }).select('_id');
    if (recent) return res.status(429).json({ message: 'Please wait a minute before asking another question.' });
    const clar = await Clarification.create({
      contest: contestId,
      user: req.user._id,
      question: String(question).trim(),
      isPrivate: !!isPrivate,
      visibility: visibility === 'team' ? 'team' : 'all',
      tags: Array.isArray(tags) ? tags.slice(0, 5).map(String) : [],
    });
    return res.status(201).json({ clarification: clar });
  } catch (error) {
    console.error('Create clarification error:', error);
    return res.status(500).json({ message: 'Failed to create clarification' });
  }
});

// Answer a clarification (admin only)
router.post('/:id/clarifications/:clarId/answer', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id, clarId } = req.params;
    const { answer } = req.body || {};
    if (!answer || String(answer).trim().length < 1) return res.status(400).json({ message: 'Answer is required' });
    const clar = await Clarification.findOne({ _id: clarId, contest: id });
    if (!clar) return res.status(404).json({ message: 'Clarification not found' });
    clar.answer = String(answer).trim();
    clar.answeredBy = req.user._id;
    clar.answeredAt = new Date();
    await clar.save();
    return res.json({ clarification: clar });
  } catch (error) {
    console.error('Answer clarification error:', error);
    return res.status(500).json({ message: 'Failed to answer clarification' });
  }
});

export default router;