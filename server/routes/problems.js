import express from 'express';
import Problem from '../models/Problem.js';
import DailyProblem from '../models/DailyProblem.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Contest from '../models/Contest.js';
import { authenticate } from '../middleware/auth.js';
import { checkProblemAccess } from '../middleware/contestAccess.js';
import { executeCode } from '../utils/codeExecutor.js';
import ts from 'typescript';

const router = express.Router();

// Public: Get global daily problem (optionally for a specific UTC date via ?date=YYYY-MM-DD)
router.get('/daily', async (req, res) => {
  try {
    const qd = String(req.query.date || '');
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const key = (/^\d{4}-\d{2}-\d{2}$/.test(qd) ? qd : `${yyyy}-${mm}-${dd}`);
    const doc = await DailyProblem.findOne({ date: key }).lean();
    if (!doc) return res.json({ success: true, dailyProblem: null });
    return res.json({ success: true, dailyProblem: { date: doc.date, problemId: String(doc.problemId) } });
  } catch (e) {
    console.error('Public get daily problem error:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch daily problem' });
  }
});

// Get all problems with filters
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      difficulty, 
      category, 
      sortBy = 'createdAt',
      page = 1,
      limit = 20,
      contestId
    } = req.query;

    let query = {};
    
    // If contestId is provided, only show problems from that contest
    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
      
      // Check if contest has started
      const now = new Date();
      if (now < contest.startTime) {
        return res.status(403).json({ message: 'Contest has not started yet' });
      }
      
      query = { _id: { $in: contest.problems } };
    } else {
      // For regular problem list, exclude contest-only problems
      query = { 
        $or: [
          { isContestOnly: false },
          { isContestOnly: { $exists: false } },
          { availableAfter: { $lte: new Date() } }
        ]
      };
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'title':
        sortOptions = { title: 1 };
        break;
      case 'difficulty':
        sortOptions = { difficulty: 1, title: 1 };
        break;
      case 'acceptance':
        sortOptions = { acceptance: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const problems = await Problem.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username')
      .select('-testCases'); // Don't send test cases to frontend

    const total = await Problem.countDocuments(query);

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
});

// Get single problem
router.get('/:id', checkProblemAccess, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('createdBy', 'username')
      .select('-testCases'); // Don't send test cases

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ problem });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ message: 'Failed to fetch problem' });
  }
});

// Submit solution
router.post('/:id/submit', authenticate, checkProblemAccess, async (req, res) => {
  try {
    let { code, language, contestId } = req.body;
    // Normalize TypeScript: transpile to JS and run as JavaScript
    if ((language || '').toLowerCase() === 'typescript') {
      try {
        const result = ts.transpileModule(String(code || ''), {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
            strict: false,
            esModuleInterop: true,
          },
        });
        code = result.outputText;
        language = 'javascript';
      } catch (e) {
        return res.status(400).json({ message: 'Failed to transpile TypeScript', error: String(e?.message || e) });
      }
    }
    const problemId = req.params.id;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // If this is a contest problem, verify the contest
    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
      
      // Check if the problem belongs to this contest
      if (!contest.problems.some(p => p.toString() === problemId)) {
        return res.status(400).json({ message: 'This problem is not part of the specified contest' });
      }
      
      // Check if contest is active
      const now = new Date();
      if (now < contest.startTime || now > contest.endTime) {
        return res.status(403).json({ message: 'Contest is not active' });
      }
      
      // Check if user is a participant
      const isParticipant = contest.participants.some(
        p => p.user.toString() === req.user.id
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant of this contest' });
      }
    }

    // Execute code against test cases
    const result = await executeCode(code, language, problem.testCases);

    console.log('Code execution result:', result);

    // Create submission record
    const submission = new Submission({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      status: result.status,
      runtime: result.runtime,
      memory: result.memory,
      testsPassed: result.testsPassed,
      totalTests: result.totalTests,
      score: result.score
    });

    await submission.save();
    console.log('Submission saved:', submission._id);

    // Update problem statistics
    problem.submissions += 1;
    if (result.status === 'Accepted') {
      problem.acceptedSubmissions += 1;
    }
    problem.updateAcceptance();
    await problem.save();

    // Award codecoin and difficulty-based points if problem solved for first time
    let earnedCodecoin = false;
    if (result.status === 'Accepted' && !req.user.solvedProblems.includes(problemId)) {
      const diff = String(problem.difficulty || '').toLowerCase();
      const incPoints = diff === 'easy' ? 1 : diff === 'medium' ? 2 : diff === 'hard' ? 3 : 1;
      console.log('Awarding codecoin and points to user:', req.user._id, 'points:', incPoints, 'difficulty:', problem.difficulty);
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { solvedProblems: problemId },
        $inc: { codecoins: 1, points: incPoints }
      });
      earnedCodecoin = true;
    }

    res.json({
      submission,
      result: {
        ...result,
        earnedCodecoin
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
});

// Run code (test without submitting)
router.post('/:id/run', authenticate, checkProblemAccess, async (req, res) => {
  try {
    let { code, language, contestId } = req.body;
    // Normalize TypeScript for run endpoint as well
    if ((language || '').toLowerCase() === 'typescript') {
      try {
        const result = ts.transpileModule(String(code || ''), {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
            strict: false,
            esModuleInterop: true,
          },
        });
        code = result.outputText;
        language = 'javascript';
      } catch (e) {
        return res.status(400).json({ message: 'Failed to transpile TypeScript', error: String(e?.message || e) });
      }
    }
    const problemId = req.params.id;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // If this is a contest problem, verify the contest
    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
      
      // Check if the problem belongs to this contest
      if (!contest.problems.some(p => p.toString() === problemId)) {
        return res.status(400).json({ message: 'This problem is not part of the specified contest' });
      }
      
      // Check if contest is active
      const now = new Date();
      if (now < contest.startTime || now > contest.endTime) {
        return res.status(403).json({ message: 'Contest is not active' });
      }
      
      // Check if user is a participant
      const isParticipant = contest.participants.some(
        p => p.user.toString() === req.user.id
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant of this contest' });
      }
    }

    // Execute code against sample test cases only
    const sampleTestCases = problem.testCases.filter(tc => !tc.hidden).slice(0, 3);
    const result = await executeCode(code, language, sampleTestCases);

    res.json({ result });
  } catch (error) {
    console.error('Code run error:', error);
    res.status(500).json({ message: 'Failed to run code' });
  }
});

export default router;