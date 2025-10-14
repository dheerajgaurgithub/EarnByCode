import axios from 'axios';

// Piston API configuration
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API - Only Java, C++, Python supported
const PISTON_LANGUAGES = {
  python: { id: 'python', version: '3.11.0' },
  cpp: { id: 'cpp', version: '10.2.0' },
  java: { id: 'java', version: '15.0.2' },
};

/**
 * Execute code using Piston API
 * @param {string} language - Programming language (java, cpp, python only)
 * @param {string} code - Source code to execute
 * @param {string} input - Input for the program
 * @returns {Promise<{output: string, error: string, exitCode: number}>}
 */
export async function executeCodeWithPiston(language, code, input = '') {
  try {
    // Normalize and validate language
    const normalizedLanguage = normalizeLanguage(language);
    if (!normalizedLanguage) {
      throw new Error(`Unsupported language: ${language}. Only Java, C++, and Python are supported.`);
    }

    const languageConfig = PISTON_LANGUAGES[normalizedLanguage];
    if (!languageConfig) {
      throw new Error(`Piston configuration missing for language: ${language}`);
    }

    // Prepare Piston API request
    const requestBody = {
      language: languageConfig.id,
      version: languageConfig.version,
      files: [
        {
          content: code,
        },
      ],
      stdin: input,
      args: [],
      compile_timeout: 10000,
      run_timeout: 8000,
      compile_memory_limit: 100000,
      run_memory_limit: 100000,
    };

    // Make request to Piston API
    const response = await axios.post(`${PISTON_API_URL}/execute`, requestBody, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { stdout, stderr, compile_output } = response.data.run;

    // Determine exit code and output
    let exitCode = 0;
    let output = stdout || '';
    let error = '';

    if (compile_output) {
      error = compile_output;
      exitCode = 1;
    } else if (stderr) {
      error = stderr;
      exitCode = 1;
    }

    return {
      output: output.trim(),
      error: error.trim(),
      exitCode,
    };
  } catch (error) {
    console.error('Piston API error:', error);

    if (error.response) {
      // Piston API error response
      throw new Error(`Piston API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to Piston API server');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Piston API request timed out');
    } else {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
}

/**
 * Normalize language names to Piston-supported formats
 * @param {string} language - Input language name
 * @returns {string|null} - Normalized language name or null if unsupported
 */
function normalizeLanguage(language) {
  const lang = language?.toLowerCase().trim();

  const mappings = {
    'python': 'python',
    'python3': 'python',
    'py': 'python',
    'c++': 'cpp',
    'cpp': 'cpp',
    'java': 'java',
  };

  return mappings[lang] || null;
}

/**
 * Get list of supported languages from Piston API
 * @returns {Promise<Array>} - Array of supported languages
 */
export async function getSupportedLanguages() {
  try {
    const response = await axios.get(`${PISTON_API_URL}/runtimes`);
    // Filter to only return Java, C++, Python runtimes
    const allRuntimes = response.data;
    const supportedLanguages = ['java', 'cpp', 'python'];

    return allRuntimes.filter(runtime =>
      supportedLanguages.includes(runtime.language)
    );
  } catch (error) {
    console.error('Failed to fetch supported languages:', error);
    // Return static list as fallback
    return [
      { language: 'python', version: '3.11.0', aliases: ['python', 'python3', 'py'] },
      { language: 'cpp', version: '10.2.0', aliases: ['cpp', 'c++'] },
      { language: 'java', version: '15.0.2', aliases: ['java'] },
    ];
  }
}
