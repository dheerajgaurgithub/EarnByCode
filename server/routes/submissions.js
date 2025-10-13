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

// Submit a solution for a problem with enhanced validation and error handling
router.post('/submit/:problemId', authenticate, async (req, res) => {
  try {
    const { code, language } = req.body;

    console.log(`🚀 Processing submission for problem ${req.params.problemId}`);

    // Enhanced input validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        message: '❌ Code is required and cannot be empty',
        error: 'INVALID_CODE'
      });
    }

    if (!language || typeof language !== 'string') {
      return res.status(400).json({
        message: '❌ Language is required',
        error: 'INVALID_LANGUAGE'
      });
    }

    // Validate language - only Java, C++, Python supported with strict validation
    const supportedLanguages = ['java', 'cpp', 'python'];
    const normalizedLang = language.toLowerCase();

    if (!supportedLanguages.includes(normalizedLang)) {
      return res.status(400).json({
        message: `❌ Unsupported language: ${language}. Only Java, C++, and Python are supported.`,
        error: 'UNSUPPORTED_LANGUAGE',
        supportedLanguages
      });
    }

    // Enhanced code validation based on language
    if (normalizedLang === 'java' && !code.includes('class')) {
      return res.status(400).json({
        message: '❌ Java code must include a class definition',
        error: 'INVALID_JAVA_CODE'
      });
    }

    if (normalizedLang === 'cpp' && !code.includes('main(')) {
      return res.status(400).json({
        message: '❌ C++ code must include a main function',
        error: 'INVALID_CPP_CODE'
      });
    }

    if (normalizedLang === 'python' && !code.includes('def ') && !code.includes('print') && !code.includes('input')) {
      return res.status(400).json({
        message: '❌ Python code must include a function definition or print/input statements',
        error: 'INVALID_PYTHON_CODE'
      });
    }

    // Get problem with enhanced error handling
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({
        message: `❌ Problem not found with ID: ${req.params.problemId}`,
        error: 'PROBLEM_NOT_FOUND'
      });
    }

    // Validate test cases exist
    if (!Array.isArray(problem.testCases) || problem.testCases.length === 0) {
      return res.status(400).json({
        message: '❌ Problem has no test cases configured',
        error: 'NO_TEST_CASES'
      });
    }

    // Validate each test case
    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      if (!testCase.input || !testCase.expectedOutput) {
        return res.status(400).json({
          message: `❌ Test case ${i + 1} is missing input or expected output`,
          error: 'INVALID_TEST_CASE'
        });
      }
    }

    console.log(`✅ Validation passed, executing ${normalizedLang} code against ${problem.testCases.length} test cases`);

    // Execute code with enhanced options
    const executionResult = await executeCode(code, normalizedLang, problem.testCases, {
      timeLimit: 10000, // 10 seconds timeout for submissions
      compareMode: 'strict', // Strict comparison for accurate results
      ignoreWhitespace: false,
      ignoreCase: false
    });

    // Enhanced response structure
    const response = {
      success: true,
      executionResult,
      problemDetails: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        testCasesCount: problem.testCases.length
      },
      submissionDetails: {
        language: normalizedLang,
        codeLength: code.length,
        submittedAt: new Date(),
        userId: req.user._id
      }
    };

    console.log(`✅ Submission completed: ${executionResult.testsPassed}/${executionResult.totalTests} tests passed (${executionResult.score}%)`);

    res.json(response);

  } catch (error) {
    console.error('💥 Submission error:', error);

    // Enhanced error response
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      errorCode: 'SUBMISSION_FAILED',
      timestamp: new Date(),
      problemId: req.params.problemId,
      userId: req.user?._id
    };

    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message?.includes('not found')) {
      statusCode = 404;
    } else if (error.message?.includes('required') || error.message?.includes('must')) {
      statusCode = 400;
    } else if (error.message?.includes('timeout')) {
      statusCode = 408;
    }

    res.status(statusCode).json(errorResponse);
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