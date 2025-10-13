import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import Problem from '../models/Problem.js';
import { executeCode } from '../utils/codeExecutor.js';

const router = express.Router();

// Run a single test case (admin only)
router.post('/run-test', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { code, language, input, expectedOutput } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    // Execute the code with the provided input
    const result = await executeCode(code, language, [{
      input,
      expectedOutput,
      isHidden: false
    }]);
    
    // Return the result
    res.json({
      ...result,
      passed: result.testCases?.[0]?.passed || false,
      output: result.testCases?.[0]?.actualOutput || '',
      error: result.error || result.testCases?.[0]?.error || ''
    });
  } catch (error) {
    console.error('Error running test case:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all test cases for a problem (admin only)
router.get('/problems/:problemId/testcases', [authenticate, requireAdmin], async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    res.json({ testCases: problem.testCases });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add test case to a problem (admin only)
router.post('/problems/:problemId/testcases', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { input, expectedOutput, hidden } = req.body;
    
    if (!input || !expectedOutput) {
      return res.status(400).json({ message: 'Input and expected output are required' });
    }
    
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    problem.testCases.push({
      input,
      expectedOutput,
      hidden: hidden || false
    });
    
    await problem.save();
    
    res.status(201).json({ 
      message: 'Test case added successfully',
      testCase: problem.testCases[problem.testCases.length - 1]
    });
  } catch (error) {
    console.error('Error adding test case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update test case (admin only)
router.put('/problems/:problemId/testcases/:testCaseId', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { input, expectedOutput, hidden } = req.body;
    
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    const testCase = problem.testCases.id(req.params.testCaseId);
    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }
    
    if (input) testCase.input = input;
    if (expectedOutput) testCase.expectedOutput = expectedOutput;
    if (hidden !== undefined) testCase.hidden = hidden;
    
    await problem.save();
    
    res.json({ message: 'Test case updated successfully', testCase });
  } catch (error) {
    console.error('Error updating test case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete test case (admin only)
router.delete('/problems/:problemId/testcases/:testCaseId', [authenticate, requireAdmin], async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    const testCase = problem.testCases.id(req.params.testCaseId);
    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }
    
    testCase.remove();
    await problem.save();
    
    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test a solution against all test cases (admin only)
router.post('/problems/:problemId/test-solution', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    if (problem.testCases.length === 0) {
      return res.status(400).json({ message: 'Problem has no test cases' });
    }
    
    // Execute code against all test cases
    const result = await executeCode(code, language, problem.testCases);
    
    res.json(result);
  } catch (error) {
    console.error('Error testing solution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test a solution against provided test cases (admin only)
router.post('/problems/test-solution', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: 'Test cases are required' });
    }
    
    // Execute code against provided test cases
    const result = await executeCode(code, language, testCases);
    
    res.json(result);
  } catch (error) {
    console.error('Error testing solution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;