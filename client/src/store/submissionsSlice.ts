import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SubmissionResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime: string;
  memory: string;
  error?: string | null;
  executionDetails?: {
    exitCode: number;
    stderr: string;
    stdout: string;
  };
}

export interface Submission {
  _id: string;
  user: string;
  problem: string;
  code: string;
  language: string;
  results: SubmissionResult[];
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  passed: boolean;
  executionTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalSubmissions: number;
  problemsSolved: number;
  totalPoints: number;
  rank: number;
  streak: number;
  lastSubmissionDate: string | null;
}

export interface SubmissionsState {
  // Submissions list
  submissions: Submission[];
  userSubmissions: Submission[];

  // Current submission
  currentSubmission: Submission | null;

  // Loading states
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // Filters and pagination
  searchQuery: string;
  selectedLanguage: string;
  selectedStatus: string;
  currentPage: number;
  totalPages: number;
  totalSubmissions: number;

  // User statistics
  userStats: UserStats | null;

  // Submission form data
  submissionForm: {
    code: string;
    language: string;
    problemId: string | null;
  };

  // Execution results (for immediate feedback)
  executionResults: {
    status: string;
    testsPassed: number;
    totalTests: number;
    results: SubmissionResult[];
    runtime: string;
    memory: string;
    score: number;
    executionSummary: {
      language: string;
      totalTestCases: number;
      passedTestCases: number;
      failedTestCases: number;
      executionTime: number;
    };
  } | null;
}

const initialState: SubmissionsState = {
  submissions: [],
  userSubmissions: [],
  currentSubmission: null,
  loading: false,
  submitting: false,
  error: null,
  searchQuery: '',
  selectedLanguage: '',
  selectedStatus: '',
  currentPage: 1,
  totalPages: 1,
  totalSubmissions: 0,
  userStats: null,
  submissionForm: {
    code: '',
    language: 'java',
    problemId: null,
  },
  executionResults: null,
};

export const submissionsSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    // Submissions management
    setSubmissions: (state, action: PayloadAction<Submission[]>) => {
      state.submissions = action.payload;
    },

    setUserSubmissions: (state, action: PayloadAction<Submission[]>) => {
      state.userSubmissions = action.payload;
    },

    setCurrentSubmission: (state, action: PayloadAction<Submission | null>) => {
      state.currentSubmission = action.payload;
    },

    addSubmission: (state, action: PayloadAction<Submission>) => {
      state.submissions.unshift(action.payload);
      state.userSubmissions.unshift(action.payload);
    },

    updateSubmission: (state, action: PayloadAction<Submission>) => {
      const index = state.submissions.findIndex(s => s._id === action.payload._id);
      if (index !== -1) {
        state.submissions[index] = action.payload;
      }

      const userIndex = state.userSubmissions.findIndex(s => s._id === action.payload._id);
      if (userIndex !== -1) {
        state.userSubmissions[userIndex] = action.payload;
      }

      if (state.currentSubmission?._id === action.payload._id) {
        state.currentSubmission = action.payload;
      }
    },

    removeSubmission: (state, action: PayloadAction<string>) => {
      state.submissions = state.submissions.filter(s => s._id !== action.payload);
      state.userSubmissions = state.userSubmissions.filter(s => s._id !== action.payload);
      if (state.currentSubmission?._id === action.payload) {
        state.currentSubmission = null;
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.submitting = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Filters and search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when searching
    },

    setSelectedLanguage: (state, action: PayloadAction<string>) => {
      state.selectedLanguage = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },

    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },

    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },

    setTotalSubmissions: (state, action: PayloadAction<number>) => {
      state.totalSubmissions = action.payload;
    },

    // User statistics
    setUserStats: (state, action: PayloadAction<UserStats | null>) => {
      state.userStats = action.payload;
    },

    updateUserStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      if (state.userStats) {
        state.userStats = { ...state.userStats, ...action.payload };
      }
    },

    // Submission form
    setSubmissionForm: (state, action: PayloadAction<Partial<SubmissionsState['submissionForm']>>) => {
      state.submissionForm = { ...state.submissionForm, ...action.payload };
    },

    resetSubmissionForm: (state) => {
      state.submissionForm = {
        code: '',
        language: 'java',
        problemId: null,
      };
    },

    // Execution results
    setExecutionResults: (state, action: PayloadAction<SubmissionsState['executionResults']>) => {
      state.executionResults = action.payload;
    },

    clearExecutionResults: (state) => {
      state.executionResults = null;
    },

    // Bulk operations
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedLanguage = '';
      state.selectedStatus = '';
      state.currentPage = 1;
    },

    // Clear all data
    clearSubmissionsData: (state) => {
      state.submissions = [];
      state.userSubmissions = [];
      state.currentSubmission = null;
      state.executionResults = null;
      state.searchQuery = '';
      state.selectedLanguage = '';
      state.selectedStatus = '';
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalSubmissions = 0;
      state.submissionForm = {
        code: '',
        language: 'java',
        problemId: null,
      };
    },
  },
});

export const {
  setSubmissions,
  setUserSubmissions,
  setCurrentSubmission,
  addSubmission,
  updateSubmission,
  removeSubmission,
  setLoading,
  setSubmitting,
  setError,
  setSearchQuery,
  setSelectedLanguage,
  setSelectedStatus,
  setCurrentPage,
  setTotalPages,
  setTotalSubmissions,
  setUserStats,
  updateUserStats,
  setSubmissionForm,
  resetSubmissionForm,
  setExecutionResults,
  clearExecutionResults,
  resetFilters,
  clearSubmissionsData,
} = submissionsSlice.actions;

export const submissionsReducer = submissionsSlice.reducer;
