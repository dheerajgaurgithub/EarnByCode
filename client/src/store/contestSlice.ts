import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contest, ContestParticipant } from '@/types';

export interface ContestProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  solved: boolean;
  attempts: number;
  lastSubmission?: string;
  penalty?: number;
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  problemId: number;
  userId: string;
  code: string;
  language: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  runtime?: number | null;
  memory?: number | null;
  submittedAt: string;
  testCasesPassed?: number;
  totalTestCases?: number;
}

export interface ContestTimer {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  lastUpdated: string;
}

export interface ContestLeaderboard {
  participants: ContestParticipant[];
  lastUpdated: string;
  totalParticipants: number;
}

export interface ContestNotification {
  id: string;
  type: 'contest_started' | 'contest_ending_soon' | 'submission_accepted' | 'rank_change' | 'contest_ended';
  message: string;
  timestamp: string;
  contestId: string;
  userId?: string;
  data?: any;
}

export interface ContestState {
  // Contest data
  contests: Contest[];
  currentContest: Contest | null;
  userContest: Contest | null; // Contest user is currently participating in

  // Contest timing
  contestTimer: ContestTimer | null;
  timeSync: boolean;

  // Contest problems and submissions
  contestProblems: ContestProblem[];
  contestSubmissions: ContestSubmission[];
  userSubmissions: ContestSubmission[];

  // Participants and standings
  participants: ContestParticipant[];
  leaderboard: ContestLeaderboard | null;
  userRank: number | null;

  // Real-time updates
  isLive: boolean;
  realTimeUpdates: boolean;
  lastUpdate: string | null;

  // Notifications
  notifications: ContestNotification[];
  unreadNotifications: number;

  // Contest management
  isCreating: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isSubmitting: boolean;

  // Loading states
  loading: boolean;
  error: string | null;

  // Contest filters and search
  searchQuery: string;
  selectedStatus: string;
  selectedDifficulty: string;
  sortBy: 'startTime' | 'endTime' | 'participants' | 'prize';

  // Pagination
  currentPage: number;
  totalPages: number;
  totalContests: number;

  // Contest settings
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showTimer: boolean;
  showLeaderboard: boolean;
}

const initialState: ContestState = {
  contests: [],
  currentContest: null,
  userContest: null,
  contestTimer: null,
  timeSync: true,
  contestProblems: [],
  contestSubmissions: [],
  userSubmissions: [],
  participants: [],
  leaderboard: null,
  userRank: null,
  isLive: false,
  realTimeUpdates: true,
  lastUpdate: null,
  notifications: [],
  unreadNotifications: 0,
  isCreating: false,
  isJoining: false,
  isLeaving: false,
  isSubmitting: false,
  loading: false,
  error: null,
  searchQuery: '',
  selectedStatus: '',
  selectedDifficulty: '',
  sortBy: 'startTime',
  currentPage: 1,
  totalPages: 1,
  totalContests: 0,
  autoRefresh: true,
  refreshInterval: 30, // 30 seconds
  showTimer: true,
  showLeaderboard: true,
};

export const contestSlice = createSlice({
  name: 'contest',
  initialState,
  reducers: {
    // Contest data management
    setContests: (state, action: PayloadAction<Contest[]>) => {
      state.contests = action.payload;
    },

    setCurrentContest: (state, action: PayloadAction<Contest | null>) => {
      state.currentContest = action.payload;
      if (action.payload) {
        state.isLive = action.payload.status === 'live';
        state.contestTimer = calculateContestTimer(action.payload);
      } else {
        state.contestTimer = null;
        state.isLive = false;
      }
    },

    setUserContest: (state, action: PayloadAction<Contest | null>) => {
      state.userContest = action.payload;
    },

    addContest: (state, action: PayloadAction<Contest>) => {
      state.contests.unshift(action.payload);
    },

    updateContest: (state, action: PayloadAction<Contest>) => {
      const index = state.contests.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.contests[index] = action.payload;
      }
      if (state.currentContest?.id === action.payload.id) {
        state.currentContest = action.payload;
        state.isLive = action.payload.status === 'live';
        state.contestTimer = calculateContestTimer(action.payload);
      }
      if (state.userContest?.id === action.payload.id) {
        state.userContest = action.payload;
      }
    },

    removeContest: (state, action: PayloadAction<string>) => {
      state.contests = state.contests.filter(c => c.id !== action.payload);
      if (state.currentContest?.id === action.payload) {
        state.currentContest = null;
        state.contestTimer = null;
        state.isLive = false;
      }
      if (state.userContest?.id === action.payload) {
        state.userContest = null;
      }
    },

    // Contest timing management
    setContestTimer: (state, action: PayloadAction<ContestTimer>) => {
      state.contestTimer = action.payload;
    },

    updateContestTimer: (state) => {
      if (state.contestTimer && state.contestTimer.isRunning && !state.contestTimer.isPaused) {
        const now = Date.now();
        const lastUpdated = new Date(state.contestTimer.lastUpdated).getTime();
        const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);

        if (state.contestTimer.timeRemaining > elapsedSeconds) {
          state.contestTimer.timeRemaining -= elapsedSeconds;
          state.contestTimer.lastUpdated = new Date().toISOString();
        } else {
          // Contest ended
          state.contestTimer.timeRemaining = 0;
          state.contestTimer.isRunning = false;
          if (state.currentContest) {
            state.currentContest.status = 'ended';
          }
        }
      }
    },

    startContestTimer: (state, action: PayloadAction<{ startTime: string; duration: number }>) => {
      const { startTime, duration } = action.payload;
      state.contestTimer = {
        startTime,
        endTime: new Date(new Date(startTime).getTime() + duration * 60 * 1000).toISOString(),
        duration,
        timeRemaining: duration * 60,
        isRunning: true,
        isPaused: false,
        lastUpdated: new Date().toISOString(),
      };
    },

    pauseContestTimer: (state) => {
      if (state.contestTimer) {
        state.contestTimer.isPaused = true;
        state.contestTimer.lastUpdated = new Date().toISOString();
      }
    },

    resumeContestTimer: (state) => {
      if (state.contestTimer) {
        state.contestTimer.isPaused = false;
        state.contestTimer.lastUpdated = new Date().toISOString();
      }
    },

    stopContestTimer: (state) => {
      if (state.contestTimer) {
        state.contestTimer.isRunning = false;
        state.contestTimer.isPaused = false;
        state.contestTimer.timeRemaining = 0;
      }
    },

    // Contest problems management
    setContestProblems: (state, action: PayloadAction<ContestProblem[]>) => {
      state.contestProblems = action.payload;
    },

    updateContestProblem: (state, action: PayloadAction<{ problemId: number; updates: Partial<ContestProblem> }>) => {
      const { problemId, updates } = action.payload;
      const index = state.contestProblems.findIndex(p => p.id === problemId);
      if (index !== -1) {
        state.contestProblems[index] = { ...state.contestProblems[index], ...updates };
      }
    },

    // Contest submissions management
    setContestSubmissions: (state, action: PayloadAction<ContestSubmission[]>) => {
      state.contestSubmissions = action.payload;
    },

    addContestSubmission: (state, action: PayloadAction<ContestSubmission>) => {
      state.contestSubmissions.push(action.payload);
      state.userSubmissions.push(action.payload);
    },

    updateContestSubmission: (state, action: PayloadAction<ContestSubmission>) => {
      const index = state.contestSubmissions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.contestSubmissions[index] = action.payload;
      }

      const userIndex = state.userSubmissions.findIndex(s => s.id === action.payload.id);
      if (userIndex !== -1) {
        state.userSubmissions[userIndex] = action.payload;
      }
    },

    // Participants and standings
    setParticipants: (state, action: PayloadAction<ContestParticipant[]>) => {
      state.participants = action.payload;
    },

    updateParticipant: (state, action: PayloadAction<ContestParticipant>) => {
      const index = state.participants.findIndex(p => p.userId === action.payload.userId);
      if (index !== -1) {
        state.participants[index] = action.payload;
      }

      // Update user rank if this is the current user
      if (action.payload.userId === state.userContest?.createdBy) {
        state.userRank = action.payload.rank ?? null;
      }
    },

    setLeaderboard: (state, action: PayloadAction<ContestLeaderboard>) => {
      state.leaderboard = action.payload;
    },

    // Real-time updates
    setRealTimeUpdates: (state, action: PayloadAction<boolean>) => {
      state.realTimeUpdates = action.payload;
    },

    setLastUpdate: (state, action: PayloadAction<string>) => {
      state.lastUpdate = action.payload;
    },

    // Notifications
    setNotifications: (state, action: PayloadAction<ContestNotification[]>) => {
      state.notifications = action.payload;
    },

    addNotification: (state, action: PayloadAction<ContestNotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.userId) {
        state.unreadNotifications += 1;
      }

      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    markNotificationsRead: (state) => {
      state.unreadNotifications = 0;
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadNotifications = 0;
    },

    // Contest management states
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },

    setJoining: (state, action: PayloadAction<boolean>) => {
      state.isJoining = action.payload;
    },

    setLeaving: (state, action: PayloadAction<boolean>) => {
      state.isLeaving = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
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
      state.currentPage = 1;
    },

    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
      state.currentPage = 1;
    },

    setSelectedDifficulty: (state, action: PayloadAction<string>) => {
      state.selectedDifficulty = action.payload;
      state.currentPage = 1;
    },

    setSortBy: (state, action: PayloadAction<'startTime' | 'endTime' | 'participants' | 'prize'>) => {
      state.sortBy = action.payload;
    },

    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },

    setTotalContests: (state, action: PayloadAction<number>) => {
      state.totalContests = action.payload;
    },

    // Contest settings
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },

    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },

    setShowTimer: (state, action: PayloadAction<boolean>) => {
      state.showTimer = action.payload;
    },

    setShowLeaderboard: (state, action: PayloadAction<boolean>) => {
      state.showLeaderboard = action.payload;
    },

    // Utility actions
    resetContestState: (state) => {
      return {
        ...initialState,
        contests: state.contests, // Keep contests list
      };
    },

    clearContestData: (state) => {
      state.contests = [];
      state.currentContest = null;
      state.userContest = null;
      state.contestTimer = null;
      state.contestProblems = [];
      state.contestSubmissions = [];
      state.userSubmissions = [];
      state.participants = [];
      state.leaderboard = null;
      state.notifications = [];
      state.unreadNotifications = 0;
    },

    // Real-time contest actions
    contestStarted: (state, action: PayloadAction<Contest>) => {
      const contest = action.payload;
      state.currentContest = contest;
      state.isLive = true;
      state.contestTimer = calculateContestTimer(contest);

      // Add notification
      state.notifications.unshift({
        id: `contest_started_${contest.id}`,
        type: 'contest_started',
        message: `Contest "${contest.title}" has started!`,
        timestamp: new Date().toISOString(),
        contestId: contest.id,
      });
      state.unreadNotifications += 1;
    },

    contestEndingSoon: (state, action: PayloadAction<{ contestId: string; minutesLeft: number }>) => {
      const { contestId, minutesLeft } = action.payload;

      // Add notification if not already added
      const existingNotification = state.notifications.find(
        n => n.type === 'contest_ending_soon' && n.contestId === contestId
      );

      if (!existingNotification) {
        state.notifications.unshift({
          id: `contest_ending_${contestId}_${minutesLeft}`,
          type: 'contest_ending_soon',
          message: `Contest ending in ${minutesLeft} minutes!`,
          timestamp: new Date().toISOString(),
          contestId,
        });
        state.unreadNotifications += 1;
      }
    },

    contestEnded: (state, action: PayloadAction<Contest>) => {
      const contest = action.payload;
      state.currentContest = contest;
      state.isLive = false;
      state.contestTimer = null;

      // Add notification
      state.notifications.unshift({
        id: `contest_ended_${contest.id}`,
        type: 'contest_ended',
        message: `Contest "${contest.title}" has ended!`,
        timestamp: new Date().toISOString(),
        contestId: contest.id,
      });
      state.unreadNotifications += 1;
    },

    submissionAccepted: (state, action: PayloadAction<{ contestId: string; problemId: number; points: number }>) => {
      const { contestId, problemId, points } = action.payload;

      // Update problem status
      const problemIndex = state.contestProblems.findIndex(p => p.id === problemId);
      if (problemIndex !== -1) {
        state.contestProblems[problemIndex].solved = true;
        state.contestProblems[problemIndex].points = points;
      }

      // Add notification
      state.notifications.unshift({
        id: `submission_accepted_${contestId}_${problemId}_${Date.now()}`,
        type: 'submission_accepted',
        message: `Problem solved! +${points} points`,
        timestamp: new Date().toISOString(),
        contestId,
        data: { problemId, points },
      });
      state.unreadNotifications += 1;
    },

    rankChanged: (state, action: PayloadAction<{ contestId: string; newRank: number; oldRank: number }>) => {
      const { contestId, newRank, oldRank } = action.payload;

      if (newRank !== oldRank) {
        state.userRank = newRank;

        // Add notification if rank improved
        if (newRank < oldRank) {
          state.notifications.unshift({
            id: `rank_change_${contestId}_${newRank}_${Date.now()}`,
            type: 'rank_change',
            message: `Rank improved to #${newRank}!`,
            timestamp: new Date().toISOString(),
            contestId,
            data: { newRank, oldRank },
          });
          state.unreadNotifications += 1;
        }
      }
    },
  },
});

// Helper function to calculate contest timer
function calculateContestTimer(contest: Contest): ContestTimer | null {
  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);

  if (now < startTime) {
    // Contest hasn't started yet
    return {
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      timeRemaining: Math.floor((startTime.getTime() - now.getTime()) / 1000),
      isRunning: false,
      isPaused: false,
      lastUpdated: now.toISOString(),
    };
  } else if (now >= startTime && now <= endTime) {
    // Contest is live
    return {
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      timeRemaining: Math.floor((endTime.getTime() - now.getTime()) / 1000),
      isRunning: true,
      isPaused: false,
      lastUpdated: now.toISOString(),
    };
  } else {
    // Contest has ended
    return {
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      timeRemaining: 0,
      isRunning: false,
      isPaused: false,
      lastUpdated: now.toISOString(),
    };
  }
}

export const {
  setContests,
  setCurrentContest,
  setUserContest,
  addContest,
  updateContest,
  removeContest,
  setContestTimer,
  updateContestTimer,
  startContestTimer,
  pauseContestTimer,
  resumeContestTimer,
  stopContestTimer,
  setContestProblems,
  updateContestProblem,
  setContestSubmissions,
  addContestSubmission,
  updateContestSubmission,
  setParticipants,
  updateParticipant,
  setLeaderboard,
  setRealTimeUpdates,
  setLastUpdate,
  setNotifications,
  addNotification,
  markNotificationsRead,
  clearNotifications,
  setCreating,
  setJoining,
  setLeaving,
  setSubmitting,
  setLoading,
  setError,
  setSearchQuery,
  setSelectedStatus,
  setSelectedDifficulty,
  setSortBy,
  setCurrentPage,
  setTotalPages,
  setTotalContests,
  setAutoRefresh,
  setRefreshInterval,
  setShowTimer,
  setShowLeaderboard,
  resetContestState,
  clearContestData,
  contestStarted,
  contestEndingSoon,
  contestEnded,
  submissionAccepted,
  rankChanged,
} = contestSlice.actions;

export const contestReducer = contestSlice.reducer;
