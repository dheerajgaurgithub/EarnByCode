import express from 'express';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import mongoose from 'mongoose';

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

export default router;