export interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  description: string;
  examples: Example[];
  constraints: string[];
  isPublished?: boolean;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  solution?: string;
  testCases: TestCase[];
  acceptance: number;
  submissions: number;
  createdBy?: string;
  createdAt?: string;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface User {
  _id: string;
  id: string; // Alias for _id for compatibility
  username: string;
  email: string;
  role: string; // Changed from 'user' | 'admin' to string for compatibility
  walletBalance: number;
  preferredCurrency?: 'USD' | 'EUR' | 'GBP' | 'INR';
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    defaultCodeLanguage?: 'javascript' | 'python' | 'java' | 'cpp';
    notifications?: {
      emailNotifications?: boolean;
      contestReminders?: boolean;
      submissionResults?: boolean;
      weeklyDigest?: boolean;
      marketingEmails?: boolean;
      frequency?: 'immediate' | 'daily' | 'weekly' | 'none';
      digestTime?: string; // HH:MM
    };
    privacy?: {
      profileVisibility?: 'public' | 'registered' | 'private';
      showEmail?: boolean;
      showSolvedProblems?: boolean;
      showContestHistory?: boolean;
      showBio?: boolean;
      showSocialLinks?: boolean;
    };
    editor?: {
      fontSize?: number; // 10-24
      tabSize?: number; // 2-8
      theme?: 'light' | 'vs-dark';
    };
    accessibility?: {
      reducedMotion?: boolean;
      highContrast?: boolean;
    };
  };
  avatarUrl?: string;
  avatarPublicId?: string;
  name?: string;
  phone?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  website?: string;
  contestsParticipated?: string[];
  github?: string;
  linkedin?: string;
  twitter?: string;
  company?: string;
  school?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  blockedUntil?: string | Date;
  createdAt: string;
  updatedAt: string;
  codecoins: number;
  points: number;
  rank?: number;
  solvedProblems: (string | number)[]; // Handle both string and number IDs
  attemptedProblems: (string | number)[]; // Handle both string and number IDs
  submissions: Submission[];
  ranking: number;
  joinDate: string;
}

export interface Submission {
  id: string;
  problemId: number;
  code: string;
  language: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  runtime?: string;
  memory?: string;
  timestamp: string;
  testsPassed?: number;
  totalTests?: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  problems: number[];
  participants: ContestParticipant[];
  status: 'upcoming' | 'live' | 'ended';
  createdBy: string;
  createdAt: string;
}

export interface ContestParticipant {
  userId: string;
  username: string;
  score: number;
  solvedProblems: number;
  lastSubmissionTime: string;
  rank?: number;
  prize?: number;
  pointsEarned?: number;
}

export interface Discussion {
  id: string;
  problemId: number;
  author: string;
  title: string;
  content: string;
  likes: number;
  replies: Reply[];
  timestamp: string;
}

export interface Reply {
  id: string;
  author: string;
  content: string;
  likes: number;
  timestamp: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'contest_entry' | 'contest_prize' | 'contest_refund';
  amount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}