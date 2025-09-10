import express from 'express';
import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Transaction from '../models/Transaction.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Get admin dashboard stats (read-only access to platform metrics)
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProblems, totalContests, activeContests] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Contest.countDocuments(),
      Contest.countDocuments({ status: 'live' })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProblems,
        totalContests,
        activeContests
      },
      // Don't include user-specific or transaction data that could be used for participation
      message: 'Admin access is restricted to platform management only.'
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Create new problem
router.post('/problems', async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      createdBy: req.user._id
    };

    const problem = new Problem(problemData);
    await problem.save();

    res.status(201).json({ 
      message: 'Problem created successfully', 
      problem 
    });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ message: 'Failed to create problem' });
  }
});

// Update problem
router.put('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem updated successfully', problem });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Failed to update problem' });
  }
});

// Get all problems
router.get('/problems', async (req, res) => {
  try {
    const { limit = 10, page = 1, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [problems, total] = await Promise.all([
      Problem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Problem.countDocuments(query)
    ]);
    
    res.json({
      problems,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
});

// Delete problem
router.delete('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Also delete related submissions
    await Submission.deleteMany({ problem: req.params.id });

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Failed to delete problem' });
  }
});

// Create new contest
router.post('/contests', async (req, res) => {
  try {
    const contestData = {
      ...req.body,
      createdBy: req.user._id
    };

    const contest = new Contest(contestData);
    await contest.save();

    res.status(201).json({ 
      message: 'Contest created successfully', 
      contest 
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ message: 'Failed to create contest' });
  }
});

// Update contest
router.put('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json({ message: 'Contest updated successfully', contest });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ message: 'Failed to update contest' });
  }
});

// Get all contests
router.get('/contests', async (req, res) => {
  try {
    const { limit = 10, page = 1, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const [contests, total] = await Promise.all([
      Contest.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'username')
        .lean(),
      Contest.countDocuments(query)
    ]);
    
    res.json({
      contests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
});

// Delete contest
router.delete('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Refund participants if contest hasn't started
    if (contest.status === 'upcoming') {
      for (const participant of contest.participants) {
        await User.findByIdAndUpdate(participant.user, {
          $inc: { walletBalance: contest.entryFee }
        });

        // Create refund transaction
        const transaction = new Transaction({
          user: participant.user,
          type: 'contest_refund',
          amount: contest.entryFee,
          description: `Refund for cancelled contest: ${contest.title}`,
          status: 'completed',
          contest: contest._id
        });

        await transaction.save();
      }
    }

    await Contest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ message: 'Failed to delete contest' });
  }
});

// Block a user
router.post('/users/:id/block', async (req, res) => {
  try {
    const { reason, duration, durationUnit } = req.body;
    const userId = req.params.id;

    if (!reason || !duration || !durationUnit) {
      return res.status(400).json({ message: 'Reason, duration, and duration unit are required' });
    }

    const durationValue = parseInt(duration);
    if (isNaN(durationValue) || durationValue < 1) {
      return res.status(400).json({ message: 'Duration must be a positive number' });
    }

    let blockedUntil = new Date();
    switch (durationUnit) {
      case 'hours':
        blockedUntil.setHours(blockedUntil.getHours() + durationValue);
        break;
      case 'days':
        blockedUntil.setDate(blockedUntil.getDate() + durationValue);
        break;
      case 'weeks':
        blockedUntil.setDate(blockedUntil.getDate() + (durationValue * 7));
        break;
      case 'months':
        blockedUntil.setMonth(blockedUntil.getMonth() + durationValue);
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid duration unit. Use hours, days, weeks, or months' 
        });
    }

    const blockData = {
      isBlocked: true,
      blockReason: reason,
      blockedUntil,
      blockDuration: durationValue,
      blockDurationUnit: durationUnit,
      $push: {
        blockHistory: {
          blockedAt: new Date(),
          blockedUntil: new Date(blockedUntil),
          reason,
          blockedBy: req.user._id,
          duration: durationValue,
          durationUnit: durationUnit,
          action: 'blocked',
          adminNote: `Blocked by ${req.user.username} (${req.user.email})`
        }
      }
    };

    const user = await User.findByIdAndUpdate(
      userId,
      blockData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a clean user object for the response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason,
      blockDuration: user.blockDuration,
      blockDurationUnit: user.blockDurationUnit
    };

    res.json({ 
      message: `User blocked until ${new Date(blockedUntil).toLocaleString()}`,
      user: userResponse
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ 
      message: 'Failed to block user',
      error: error.message 
    });
  }
});

// Unblock a user
router.post('/users/:id/unblock', async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    // First get the current user data to check if they're actually blocked
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is not blocked, return success immediately
    if (!currentUser.isBlocked) {
      return res.json({ 
        message: 'User is not currently blocked',
        user: {
          id: currentUser._id,
          username: currentUser.username,
          email: currentUser.email,
          isBlocked: false
        }
      });
    }
    
    const updateData = {
      $set: {
        isBlocked: false,
        blockReason: '',
        blockedUntil: null,
        blockDuration: undefined,
        blockDurationUnit: undefined,
      },
      $push: {
        blockHistory: {
          unblockedAt: new Date(),
          unblockedBy: req.user._id,
          action: 'unblocked',
          reason: reason || 'Manually unblocked by admin',
          adminNote: `Unblocked by ${req.user.username} (${req.user.email})`,
          // Include the previous block details for reference
          previousBlock: {
            reason: currentUser.blockReason,
            blockedAt: currentUser.blockedAt,
            blockedUntil: currentUser.blockedUntil,
            duration: currentUser.blockDuration,
            durationUnit: currentUser.blockDurationUnit
          }
        }
      }
    };
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a clean user object for the response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason
    };

    res.json({ 
      message: 'User has been unblocked successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ 
      message: 'Failed to unblock user',
      error: error.message 
    });
  }
});

// Get all users for management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;