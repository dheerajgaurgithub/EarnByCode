import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkContestAccess } from '../middleware/contestAccess.js';
import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';

const router = express.Router({ mergeParams: true });

// Add a problem to a contest (Admin only)
router.post('/:contestId', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { contestId } = req.params;
    const { problemId } = req.body;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Mark problem as contest-only and associate with this contest
    problem.isContestOnly = true;
    problem.contest = contestId;
    problem.availableAfter = contest.endTime; // Make available after contest ends
    
    await problem.save();
    await contest.addProblem(problemId);

    res.status(200).json({ 
      message: 'Problem added to contest successfully',
      problem
    });
  } catch (error) {
    console.error('Error adding problem to contest:', error);
    res.status(500).json({ message: 'Failed to add problem to contest' });
  }
});

// Remove a problem from a contest (Admin only)
router.delete('/:contestId/:problemId', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { contestId, problemId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Only remove contest association, don't delete the problem
    problem.isContestOnly = false;
    problem.contest = undefined;
    problem.availableAfter = undefined;
    
    await problem.save();
    await contest.removeProblem(problemId);

    res.status(200).json({ 
      message: 'Problem removed from contest successfully'
    });
  } catch (error) {
    console.error('Error removing problem from contest:', error);
    res.status(500).json({ message: 'Failed to remove problem from contest' });
  }
});

// List all problems in a contest (admin can access anytime)
router.get('/:contestId', authenticate, async (req, res) => {
  // Allow admin to access contest problems anytime
  if (req.user?.isAdmin) {
    try {
      const { contestId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const contest = await Contest.findById(contestId)
        .populate({
          path: 'problems',
          select: 'title difficulty category tags',
          options: {
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit)
          }
        });

      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }

      const total = contest.problems.length;
      return res.json({
        problems: contest.problems,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching contest problems (admin):', error);
      return res.status(500).json({ message: 'Failed to fetch contest problems' });
    }
  }
  
  // For non-admin users, use the regular access check
  return checkContestAccess(req, res, async () => {
    try {
      const { contestId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const contest = await Contest.findById(contestId)
        .populate({
          path: 'problems',
          select: 'title difficulty category tags',
          options: {
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit)
          }
        });

      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }

      const total = contest.problems.length;

      res.json({
        problems: contest.problems,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching contest problems:', error);
      res.status(500).json({ message: 'Failed to fetch contest problems' });
    }
  });
});

export default router;
