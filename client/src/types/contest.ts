export interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  rules?: string[];
  isRegistered?: boolean;
  participants?: string[];
}

export interface ContestResponse {
  contest?: Contest;
  _id?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  rules?: string[];
}

export interface TestCaseResult {
  passed: boolean;
  input?: any;
  expected?: any;
  output?: any;
  error?: string;
  executionTime?: number;
}

export interface RunTestResponse {
  results: TestCaseResult[];
  passed: number;
  total: number;
  executionTime: number;
  error?: string;
}
