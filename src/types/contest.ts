export interface User {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: Record<string, string>;
  testCases: Array<{
    input: any;
    expected: any;
    isHidden: boolean;
  }>;
  constraints: string[];
  examples: Array<{
    input: any;
    output: any;
    explanation?: string;
  }>;
  guidelines?: string;
}

export interface TestCaseResult {
  input: any;
  expected: any;
  output: any;
  passed: boolean;
  executionTime?: number;
  error?: string;
}

export interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  rules: string[];
  prizes: string[];
  guidelines?: string;
  isPublic: boolean;
  isRegistered?: boolean;
  participants: Array<{
    user: string | User;
    score: number;
    solvedProblems: Array<{
      problem: string | Problem;
      solvedAt: Date;
      points: number;
    }>;
    rank: number;
    prize: number;
    pointsEarned: number;
  }>;
  problems: string[] | Problem[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  feedbacks?: Array<{
    _id: string;
    user: User;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  averageRating?: number;
  feedbackCount?: number;
}

export interface ContestResponse {
  contest?: Contest;
  problems?: Problem[];
  _id?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  rules?: string[];
}

export interface RunTestResponse {
  data: {
    results: TestCaseResult[];
    passed: number;
    total: number;
    executionTime: number;
    error?: string;
  };
  status: number;
  statusText: string;
}
