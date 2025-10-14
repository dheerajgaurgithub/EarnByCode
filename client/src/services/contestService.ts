import { Contest } from '@/types';
import { ContestSubmission, ContestProblem } from '@/store/contestSlice';
import { useAppDispatch } from '@/store/hooks';
import {
  setContests,
  setCurrentContest,
  setUserContest,
  addContest,
  setLoading,
  setError,
  setParticipants,
  setLeaderboard,
  setContestProblems,
  addContestSubmission,
  setCreating,
  setJoining,
  setLeaving,
  setSubmitting,
} from '@/store/contestSlice';

export class ContestService {
  private dispatch = useAppDispatch();
  private apiBase = process.env.REACT_APP_API_URL || 'https://earnbycode-mfs3.onrender.com/api';

  // Contest CRUD operations
  async getContests(filters?: {
    status?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    this.dispatch(setLoading(true));
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`${this.apiBase}/contests?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contests');

      const data = await response.json();
      this.dispatch(setContests(data.contests || []));
      return data;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contests'));
      throw error;
    } finally {
      this.dispatch(setLoading(false));
    }
  }

  async getContest(contestId: string) {
    this.dispatch(setLoading(true));
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}`);
      if (!response.ok) throw new Error('Failed to fetch contest');

      const data = await response.json();
      this.dispatch(setCurrentContest(data.contest));
      return data.contest;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contest'));
      throw error;
    } finally {
      this.dispatch(setLoading(false));
    }
  }

  async createContest(contestData: Partial<Contest>) {
    this.dispatch(setCreating(true));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create contest');
      }

      const data = await response.json();
      this.dispatch(addContest(data.contest));
      return data.contest;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to create contest'));
      throw error;
    } finally {
      this.dispatch(setCreating(false));
    }
  }

  async joinContest(contestId: string) {
    this.dispatch(setJoining(true));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join contest');
      }

      const data = await response.json();
      this.dispatch(setUserContest(data.contest));
      return data.contest;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to join contest'));
      throw error;
    } finally {
      this.dispatch(setJoining(false));
    }
  }

  async leaveContest(contestId: string) {
    this.dispatch(setLeaving(true));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to leave contest');
      }

      this.dispatch(setUserContest(null));
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to leave contest'));
      throw error;
    } finally {
      this.dispatch(setLeaving(false));
    }
  }

  // Contest problems and submissions
  async getContestProblems(contestId: string) {
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}/problems`);
      if (!response.ok) throw new Error('Failed to fetch contest problems');

      const data = await response.json();
      this.dispatch(setContestProblems(data.problems || []));
      return data.problems;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contest problems'));
      throw error;
    }
  }

  async submitContestSolution(contestId: string, problemId: number, code: string, language: string) {
    this.dispatch(setSubmitting(true));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId,
          code,
          language,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit solution');
      }

      const data = await response.json();
      this.dispatch(addContestSubmission(data.submission));

      // Update problem status if submission was accepted
      if (data.submission.status === 'accepted') {
        this.dispatch({
          type: 'contest/submissionAccepted',
          payload: {
            contestId,
            problemId,
            points: data.points || 100,
          },
        });
      }

      return data;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to submit solution'));
      throw error;
    } finally {
      this.dispatch(setSubmitting(false));
    }
  }

  // Contest participants and leaderboard
  async getContestParticipants(contestId: string) {
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch contest participants');

      const data = await response.json();
      this.dispatch(setParticipants(data.participants || []));
      return data.participants;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contest participants'));
      throw error;
    }
  }

  async getContestLeaderboard(contestId: string) {
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch contest leaderboard');

      const data = await response.json();
      this.dispatch(setLeaderboard(data.leaderboard));
      return data.leaderboard;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contest leaderboard'));
      throw error;
    }
  }

  // Contest timer and real-time updates
  async startContestTimer(contestId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start contest');
      }

      const data = await response.json();
      return data.contest;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to start contest'));
      throw error;
    }
  }

  async pauseContestTimer(contestId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to pause contest');
      }

      return true;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to pause contest'));
      throw error;
    }
  }

  async resumeContestTimer(contestId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resume contest');
      }

      return true;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to resume contest'));
      throw error;
    }
  }

  // Contest notifications
  async getContestNotifications(contestId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiBase}/contests/${contestId}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch contest notifications');

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Failed to fetch contest notifications:', error);
      return [];
    }
  }

  // Contest results
  async getContestResults(contestId: string) {
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}/results`);
      if (!response.ok) throw new Error('Failed to fetch contest results');

      const data = await response.json();
      return data.results;
    } catch (error) {
      this.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch contest results'));
      throw error;
    }
  }

  // Contest statistics
  async getContestStats(contestId: string) {
    try {
      const response = await fetch(`${this.apiBase}/contests/${contestId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch contest statistics');

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Failed to fetch contest statistics:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const contestService = new ContestService();
