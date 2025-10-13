import express from 'express';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user submissions
router.get('/', authenticate, async (req, res) => {
  try {
    const { problemId, status, language, sort } = req.query;
    const page = parseInt(String(req.query.page || 1), 10) || 1;
    const limit = parseInt(String(req.query.limit || 20), 10) || 20;
    
    let query = { user: req.user._id };
    
    if (problemId) {
      query.problem = problemId;
    }
    
    if (status && status !== 'all') {
      const map = {
        accepted: 'Accepted',
        wrong_answer: 'Wrong Answer',
        time_limit_exceeded: 'Time Limit Exceeded',
        runtime_error: 'Runtime Error',
        compilation_error: 'Compilation Error',
      };
      const key = String(status).toLowerCase();
      query.status = map[key] || status; // accept exact matches too
    }

    if (language && language !== 'all') {
      query.language = String(language).toLowerCase();
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
      .limit(limit)
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

// Submit a solution for a problem with test case validation
router.post('/submit/:problemId', authenticate, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    // Validate language
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ message: `Language not supported. Supported languages: ${supportedLanguages.join(', ')}` });
    }
    
    // Get problem
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // Import executeCode function
    const { executeCode } = await import('../utils/codeExecutor.js');
    
    // Execute code against all test cases
    const executionResult = await executeCode(code, language, problem.testCases, {
      timeout: 10000, // 10 seconds timeout for submissions
      ignoreWhitespace: true,
      ignoreCase: false
    });
    
    // Calculate score based on passed test cases
    const visibleTestCases = problem.testCases.filter(tc => !tc.hidden);
    const hiddenTestCases = problem.testCases.filter(tc => tc.hidden);
    
    const visiblePassed = executionResult.results
      .filter((r, i) => !problem.testCases[i].hidden)
      .every(r => r.passed);
      
    const allPassed = executionResult.results.every(r => r.passed);
    
    // Create submission record
    const submission = new Submission({
      user: req.user._id,
      problem: req.params.problemId,
      code,
      language,
      results: executionResult.results,
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      passed: allPassed,
      visiblePassed,
      executionTime: executionResult.executionTime
    });
    
    await submission.save();
    
    // Update user stats if all test cases passed
    if (allPassed) {
      const user = await User.findById(req.user._id);
      
      // Check if this is the first time solving this problem
      const previousSolved = await Submission.findOne({
        user: req.user._id,
        problem: req.params.problemId,
        status: 'Accepted'
      }).sort({ createdAt: -1 });
      
      if (!previousSolved) {
        user.problemsSolved = (user.problemsSolved || 0) + 1;
        user.totalPoints = (user.totalPoints || 0) + (problem.points || 10); // Default 10 points if not specified
        await user.save();
      }
    }
    
    // Return results with hidden test cases masked
    const maskedResults = executionResult.results.map((result, index) => {
      if (problem.testCases[index].hidden) {
        return {
          ...result,
          input: 'Hidden',
          expectedOutput: 'Hidden',
          actualOutput: result.passed ? 'Correct' : 'Incorrect'
        };
      }
      return result;
    });
    
    res.json({
      submission: submission._id,
      results: maskedResults,
      passed: allPassed,
      visiblePassed,
      executionTime: executionResult.executionTime
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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