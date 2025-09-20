import express from 'express';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user submissions
router.get('/', authenticate, async (req, res) => {
  try {
    const { problemId, status, page = 1, limit = 20, sort } = req.query;
    
    let query = { user: req.user._id };
    
    if (problemId) {
      query.problem = problemId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Server-side sorting
    let sortOptions = { createdAt: -1 };
    switch ((sort || '').toString()) {
      case 'date_asc':
        sortOptions = { createdAt: 1 };
        break;
      case 'status_asc':
        sortOptions = { status: 1, createdAt: -1 };
        break;
      case 'status_desc':
        sortOptions = { status: -1, createdAt: -1 };
        break;
      case 'lang_asc':
        sortOptions = { language: 1, createdAt: -1 };
        break;
      case 'lang_desc':
        sortOptions = { language: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const submissions = await Submission.find(query)
      .populate('problem', 'title difficulty')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// Get single submission
router.get('/:id', authenticate, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('problem', 'title difficulty');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// Get all submissions for a problem (for admin)
router.get('/problem/:problemId', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const submissions = await Submission.find({ problem: req.params.problemId })
      .populate('user', 'username email')
      .populate('problem', 'title')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Get problem submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

export default router;