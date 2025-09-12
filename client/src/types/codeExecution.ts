export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  runtime?: number;
}

export interface CodeExecutionResult {
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compilation_error' | 'time_limit_exceeded' | 'error' | 'running';
  message?: string;
  error?: string;
  testCases?: TestCaseResult[];
  results?: Array<{
    passed: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
  }>;
  testsPassed?: number;
  totalTests?: number;
  runtimeMs?: number;
  memoryKb?: number;
  isSubmission?: boolean;
  earnedCodecoin?: boolean;
  codecoinReward?: number;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance: number;
  submissions: number;
  starterCode: {
    [key: string]: string;
  };
  testCases: Array<{
    input: string;
    output: string;
  }>;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  tags: string[];
  hints?: string[];
  solution?: string;
  isPremium: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
}
