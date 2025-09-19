import express from 'express';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';

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

    // Check wallet balance
    if (req.user.walletBalance < contest.entryFee) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check max participants
    if (contest.participants.length >= contest.maxParticipants) {
      return res.status(400).json({ message: 'Contest is full' });
    }

    // Deduct entry fee
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -contest.entryFee },
      $addToSet: { contestsParticipated: contestId }
    });

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
      description: `Entry fee for ${contest.title}`,
      status: 'completed',
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

export default router;