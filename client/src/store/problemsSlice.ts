import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
  explanation?: string;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  testCases: TestCase[];
  points?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProblemsState {
  // Problems list
  problems: Problem[];
  currentProblem: Problem | null;

  // Loading states
  loading: boolean;
  error: string | null;

  // Filters and search
  searchQuery: string;
  selectedDifficulty: string;
  selectedCategory: string;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalProblems: number;

  // Test cases management
  testCases: TestCase[];
  selectedTestCaseIndex: number;

  // Submission results
  submissionResults: {
    problemId: string;
    results: any[];
    passed: boolean;
    score: number;
    executionTime: string;
  } | null;
}

const initialState: ProblemsState = {
  problems: [],
  currentProblem: null,
  loading: false,
  error: null,
  searchQuery: '',
  selectedDifficulty: '',
  selectedCategory: '',
  currentPage: 1,
  totalPages: 1,
  totalProblems: 0,
  testCases: [],
  selectedTestCaseIndex: 0,
  submissionResults: null,
};

export const problemsSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    // Problems management
    setProblems: (state, action: PayloadAction<Problem[]>) => {
      state.problems = action.payload;
    },

    setCurrentProblem: (state, action: PayloadAction<Problem | null>) => {
      state.currentProblem = action.payload;
      if (action.payload) {
        state.testCases = action.payload.testCases || [];
      }
    },

    addProblem: (state, action: PayloadAction<Problem>) => {
      state.problems.unshift(action.payload);
    },

    updateProblem: (state, action: PayloadAction<Problem>) => {
      const index = state.problems.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.problems[index] = action.payload;
      }
      if (state.currentProblem?._id === action.payload._id) {
        state.currentProblem = action.payload;
        state.testCases = action.payload.testCases || [];
      }
    },

    removeProblem: (state, action: PayloadAction<string>) => {
      state.problems = state.problems.filter(p => p._id !== action.payload);
      if (state.currentProblem?._id === action.payload) {
        state.currentProblem = null;
        state.testCases = [];
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Filters and search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when searching
    },

    setSelectedDifficulty: (state, action: PayloadAction<string>) => {
      state.selectedDifficulty = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },

    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },

    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },

    setTotalProblems: (state, action: PayloadAction<number>) => {
      state.totalProblems = action.payload;
    },

    // Test cases management
    setTestCases: (state, action: PayloadAction<TestCase[]>) => {
      state.testCases = action.payload;
      if (state.currentProblem) {
        state.currentProblem.testCases = action.payload;
      }
    },

    updateTestCase: (state, action: PayloadAction<{ index: number; testCase: Partial<TestCase> }>) => {
      const { index, testCase } = action.payload;
      if (state.testCases[index]) {
        state.testCases[index] = { ...state.testCases[index], ...testCase };
      }
      if (state.currentProblem) {
        state.currentProblem.testCases[index] = { ...state.currentProblem.testCases[index], ...testCase };
      }
    },

    addTestCase: (state, action: PayloadAction<TestCase>) => {
      state.testCases.push(action.payload);
      if (state.currentProblem) {
        state.currentProblem.testCases.push(action.payload);
      }
    },

    removeTestCase: (state, action: PayloadAction<number>) => {
      state.testCases.splice(action.payload, 1);
      if (state.currentProblem) {
        state.currentProblem.testCases.splice(action.payload, 1);
      }
    },

    setSelectedTestCaseIndex: (state, action: PayloadAction<number>) => {
      state.selectedTestCaseIndex = action.payload;
    },

    // Submission results
    setSubmissionResults: (state, action: PayloadAction<ProblemsState['submissionResults']>) => {
      state.submissionResults = action.payload;
    },

    clearSubmissionResults: (state) => {
      state.submissionResults = null;
    },

    // Bulk operations
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedDifficulty = '';
      state.selectedCategory = '';
      state.currentPage = 1;
    },

    // Clear all data
    clearProblemsData: (state) => {
      state.problems = [];
      state.currentProblem = null;
      state.testCases = [];
      state.submissionResults = null;
      state.searchQuery = '';
      state.selectedDifficulty = '';
      state.selectedCategory = '';
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalProblems = 0;
    },
  },
});

export const {
  setProblems,
  setCurrentProblem,
  addProblem,
  updateProblem,
  removeProblem,
  setLoading,
  setError,
  setSearchQuery,
  setSelectedDifficulty,
  setSelectedCategory,
  setCurrentPage,
  setTotalPages,
  setTotalProblems,
  setTestCases,
  updateTestCase,
  addTestCase,
  removeTestCase,
  setSelectedTestCaseIndex,
  setSubmissionResults,
  clearSubmissionResults,
  resetFilters,
  clearProblemsData,
} = problemsSlice.actions;

export const problemsReducer = problemsSlice.reducer;
