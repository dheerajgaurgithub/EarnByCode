import express from 'express';
import { executeCodeWithPiston } from '../services/piston.js';

const router = express.Router();

/**
 * Execute code and compare with expected output - Only Java, C++, Python supported
 * POST /api/run
 * Body: { language, code, input, expectedOutput }
 */
router.post('/', express.json({ limit: '256kb' }), async (req, res) => {
  try {
    const { language, code, input, expectedOutput } = req.body;

    // Validate required fields
    if (!language || !code) {
      return res.status(400).json({
        error: 'Missing required fields: language and code are required'
      });
    }

    // Validate language is supported
    const supportedLanguages = ['java', 'cpp', 'python', 'c++', 'python3', 'py'];
    const normalizedLanguage = language.toLowerCase().trim();

    if (!supportedLanguages.includes(normalizedLanguage)) {
      return res.status(400).json({
        error: `Unsupported language: ${language}. Only Java, C++, and Python are supported.`
      });
    }

    // Execute code using Piston API
    const executionResult = await executeCodeWithPiston(normalizedLanguage, code, input || '');

    // Compare output with expected output if provided
    let pass = false;
    if (expectedOutput !== undefined) {
      pass = executionResult.output.trim() === expectedOutput.trim();
    }

    // Return result
    return res.status(200).json({
      output: executionResult.output,
      error: executionResult.error,
      exitCode: executionResult.exitCode,
      pass,
      language: normalizedLanguage,
      executed: true
    });

  } catch (error) {
    console.error('Code execution error:', error);

    return res.status(500).json({
      error: error.message,
      output: '',
      pass: false,
      executed: false
    });
  }
});

/**
 * Get supported languages from Piston API - Only Java, C++, Python
 * GET /api/languages
 */
router.get('/languages', async (req, res) => {
  try {
    const { getSupportedLanguages } = await import('../services/piston.js');
    const languages = await getSupportedLanguages();

    return res.status(200).json({
      languages,
      count: languages.length,
      supported: ['java', 'cpp', 'python']
    });
  } catch (error) {
    console.error('Failed to fetch languages:', error);

    return res.status(500).json({
      error: 'Failed to fetch supported languages',
      languages: []
    });
  }
});

export default router;
