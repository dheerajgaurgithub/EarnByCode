import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { 
  Lock, Unlock, Search, Shield, Users, Code, Trophy, 
  Plus, Edit, Trash2, Loader2, Calendar, Clock, Tag, Check, X, AlertCircle
} from 'lucide-react';
import { Switch } from '@headlessui/react';
import { Dialog, Transition } from '@headlessui/react';
import apiService from '../../services/api';
import { walletService } from '../../services/walletService';
import type { User } from '../../types';
import ContestProblemManager from '../../components/Admin/ContestProblemManager';
import JobsList from '@/components/Admin/Jobs/JobsList';
import { useToast } from '@/components/ui/use-toast';

// Type definitions
type BlockHistoryItem = {
  action: 'blocked' | 'unblocked';
  timestamp: string;
  reason?: string;
  duration?: number;
  durationUnit?: 'days' | 'weeks' | 'months';
  blockedUntil?: string;
  admin: {
    _id: string;
    username: string;
  };
  previousBlock?: {
    reason?: string;
    blockedUntil?: string;
  };
};

interface ExtendedUser extends User {
  blockHistory?: BlockHistoryItem[];
  displayName?: string;
  // Server may return isEmailVerified in addition to isVerified in User type
  isEmailVerified?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  search: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  users?: T[];
  total?: number;
  page?: number;
  limit?: number;
  blockedUntil?: string;
  blockReason?: string;
  message?: string;
}

type ContestStatus = 'upcoming' | 'ongoing' | 'completed';

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  problems: string[];
  participants: string[];
  isPublic: boolean;
  status?: ContestStatus;
  rules?: string[];
  tags?: string[];
  prizeDistribution?: {
    first: number;
    second: number;
    third: number;
    [key: string]: number;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ContestFormData extends Omit<Contest, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

interface ContestsResponse {
  success: boolean;
  contests: Contest[];
  total?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  problems?: T[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  testCases: Array<{
    input: string;
    output: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  starterCode: Record<string, string>;
  isPremium: boolean;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  solution?: string;
  category?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints?: string[];
}

// UserAvatar component (initials-only, no images)
const UserAvatar = ({ username }: { username: string }) => {
  return (
    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-blue-600 font-medium text-sm">
        {username.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || 'admin';
  const toast = useToast();
  
  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'problems' | 'contests' | 'jobs'>('overview');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [showContestForm, setShowContestForm] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showContestProblemManager, setShowContestProblemManager] = useState(false);

  // Contest State
  const [contests, setContests] = useState<Contest[]>([]);
  const [isContestsLoading, setIsContestsLoading] = useState(false);
  const [contestError, setContestError] = useState<string | null>(null);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);

  // Contest Form State
  const [contestForm, setContestForm] = useState<ContestFormData>({
    title: '',
    description: '',
    isPublic: true,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    duration: 120,
    problems: [],
    participants: [],
    status: 'upcoming',
    maxParticipants: 100,
    entryFee: 0,
    prizePool: 0,
    rules: [],
    tags: [],
    prizeDistribution: { first: 50, second: 30, third: 20 }
  });

  // Contest Pagination
  const [contestPagination, setContestPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    search: string;
  }>({
    page: 1,
    limit: 10,
    total: 0,
    search: ''
  });

  // User State
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [userError, setUserError] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  
  // User Pagination
  const [userPagination, setUserPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    search: ''
  });

  // Problem State
  const [problems, setProblems] = useState<Problem[]>([]);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [isProblemsLoading, setIsProblemsLoading] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);

  // Problem Pagination
  const [problemPagination, setProblemPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    search: ''
  });

  // Block State
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('7');
  const [blockDurationUnit, setBlockDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');

  // Stats State
  const [stats, setStats] = useState<{
    totalUsers?: number;
    activeUsers?: number;
    blockedUsers?: number;
    totalContests?: number;
    activeContests?: number;
    totalProblems?: number;
    totalSubmissions?: number;
  }>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  // Debug email tester state
  const [testEmail, setTestEmail] = useState<string>('');
  const [debugKey, setDebugKey] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<string>('');
  
  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    try {
      setIsUserLoading(true);
      setUserError(null);
      const response = await apiService.getUsers({
        page: userPagination.page,
        limit: userPagination.limit,
        search: userPagination.search
      });
      
      setUsers(response.users || []);
      setUserPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserError('Failed to fetch users');
    } finally {
      setIsUserLoading(false);
    }
  }, [userPagination.page, userPagination.limit, userPagination.search]);

  const fetchProblems = useCallback(async () => {
    try {
      setIsProblemsLoading(true);
      setProblemError(null);
      const response = await apiService.getAdminProblems({
        page: problemPagination.page,
        limit: problemPagination.limit,
        search: problemPagination.search
      });
      
      setProblems(response.problems || []);
      setAvailableProblems(response.problems || []);
      setProblemPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Error fetching problems:', error);
      setProblemError('Failed to fetch problems');
    } finally {
      setIsProblemsLoading(false);
    }
  }, [problemPagination.page, problemPagination.limit, problemPagination.search]);

  // Simplified contest fetching function
  const fetchContests = useCallback(async () => {
    try {
      setIsContestsLoading(true);
      setContestError(null);
      
      const response = await apiService.getAdminContests({
        page: contestPagination.page,
        limit: contestPagination.limit,
        search: contestPagination.search
      });
      
      if (response && response.contests) {
        setContests(response.contests);
        setContestPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      } else {
        setContests([]);
        setContestPagination(prev => ({
          ...prev,
          total: 0
        }));
      }
    } catch (error: any) {
      console.error('Error fetching contests:', error);
      setContestError(error.message || 'Failed to fetch contests');
      setContests([]);
      setContestPagination(prev => ({
        ...prev,
        total: 0
      }));
    } finally {
      setIsContestsLoading(false);
    }
  }, [contestPagination.page, contestPagination.limit, contestPagination.search]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      console.log('Fetching admin stats...');
      const { stats } = await apiService.getAdminStats();
      console.log('Admin stats:', stats);
      
      if (stats) {
        const statsData = {
          totalUsers: stats.totalUsers || 0,
          activeUsers: stats.activeUsers || 0,
          blockedUsers: stats.blockedUsers || 0,
          totalContests: stats.totalContests || 0,
          activeContests: stats.activeContests || 0,
          totalProblems: stats.totalProblems || 0,
          totalSubmissions: stats.totalSubmissions || 0
        };

        console.log('Setting stats data:', statsData);
        setStats(statsData);
      } else {
        console.error('Empty response from getAdminStats');
        setStatsError('Received empty response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load stats';
      console.error('Error fetching admin stats:', error);
      setStatsError(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Admin: send a test email to verify provider
  const handleSendTestEmail = useCallback(async () => {
    setTestEmailResult('');
    if (!testEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail)) {
      try { toast.error?.('Enter a valid email'); } catch {}
      return;
    }
    try {
      setSendingTestEmail(true);
      const url = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || 'https://algobucks.onrender.com/api'}/auth/debug/send-test-email`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (debugKey) headers['x-debug-key'] = debugKey;
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: testEmail })
      });
      const data = await resp.json().catch(() => ({} as any));
      if (!resp.ok) throw new Error(data?.message || `HTTP ${resp.status}`);
      setTestEmailResult(`Sent via provider=${data?.provider || 'unknown'}`);
      try { toast.success?.('Test email sent'); } catch {}
    } catch (e: any) {
      console.error('Debug send-test-email error:', e);
      setTestEmailResult(`Failed: ${e?.message || e}`);
      try { toast.error?.(e?.message || 'Failed to send test email'); } catch {}
    } finally {
      setSendingTestEmail(false);
    }
  }, [testEmail, debugKey, toast]);

  // Debug email tester card (Admin only UI)
  const OverviewDebugEmailCard = () => (
    <div className="mt-4 p-4 border border-blue-100 rounded-md bg-white">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Email Delivery Tester (Admin)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="email"
          placeholder="Recipient email"
          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md bg-white text-black"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="x-debug-key (prod only)"
          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md bg-white text-black"
          value={debugKey}
          onChange={(e) => setDebugKey(e.target.value)}
        />
        <button
          onClick={handleSendTestEmail}
          disabled={sendingTestEmail}
          className={`px-3 py-1.5 text-xs rounded-md text-white ${sendingTestEmail ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {sendingTestEmail ? 'Sending…' : 'Send Test Email'}
        </button>
      </div>
      {testEmailResult && (
        <p className="mt-2 text-xs text-gray-700">{testEmailResult}</p>
      )}
    </div>
  );

  // Effect for initial stats load
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

  // Effect for tab-based data loading
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'problems') {
        await fetchProblems();
      } else if (activeTab === 'contests') {
        await fetchContests();
      }
    };

    loadData();
  }, [activeTab, userPagination.page, userPagination.limit, userPagination.search, 
      problemPagination.page, problemPagination.limit, problemPagination.search,
      contestPagination.page, contestPagination.limit, fetchUsers, fetchProblems, fetchContests]);

  // Debounced search effect for contests
  useEffect(() => {
    if (activeTab === 'contests') {
      const timer = setTimeout(() => {
        fetchContests();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [contestPagination.search, activeTab, fetchContests]);

  // Event handlers
  const handleContestInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setContestForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  }, []);

  const handleProblemSelect = useCallback((problemId: string, selected: boolean) => {
    setContestForm(prev => {
      const currentProblems = Array.isArray(prev.problems) ? [...prev.problems] : [];
      
      if (selected && !currentProblems.includes(problemId)) {
        return { ...prev, problems: [...currentProblems, problemId] };
      } else if (!selected) {
        return { ...prev, problems: currentProblems.filter(id => id !== problemId) };
      }
      return prev;
    });
  }, []);

  const handleSubmitContest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setContestError(null);
      
      const contestData = {
        ...contestForm,
        isPublic: true, // Always set to public
        startTime: new Date(contestForm.startTime).toISOString(),
        endTime: new Date(contestForm.endTime).toISOString(),
        createdBy: currentUserId,
        problems: Array.isArray(contestForm.problems) ? contestForm.problems : []
      };
      
      if (selectedContestId) {
        await apiService.updateContest(selectedContestId, contestData);
      } else {
        await apiService.createContest(contestData);
      }
      
      // Reset form and refresh contests
      setContestForm({
        title: '',
        description: '',
        isPublic: true,
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        duration: 120,
        problems: [],
        participants: [],
        status: 'upcoming',
        maxParticipants: 100,
        entryFee: 0,
        prizePool: 0,
        rules: [],
        tags: [],
        prizeDistribution: { first: 50, second: 30, third: 20 }
      });
      
      setSelectedContestId(null);
      setShowContestForm(false);
      await fetchContests();
      
    } catch (error) {
      console.error('Error saving contest:', error);
      setContestError('Failed to save contest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [contestForm, selectedContestId, currentUserId, fetchContests]);

  const handleUserSearch = useCallback(() => {
    setUserPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  }, [fetchUsers]);

  const handleProblemSearch = useCallback(() => {
    setProblemPagination(prev => ({ ...prev, page: 1 }));
    fetchProblems();
  }, [fetchProblems]);

  const handleUserPageChange = useCallback((page: number) => {
    setUserPagination(prev => ({ ...prev, page }));
  }, []);

  const handleProblemPageChange = useCallback((page: number) => {
    setProblemPagination(prev => ({ ...prev, page }));
  }, []);

  const handleContestPageChange = useCallback((page: number) => {
    setContestPagination(prev => ({ ...prev, page }));
  }, []);

  const handleBlockUser = useCallback(async (user: ExtendedUser) => {
    try {
      setIsSubmitting(true);
      await apiService.blockUser(user._id, {
        reason: blockReason,
        duration: parseInt(blockDuration),
        durationUnit: blockDurationUnit
      });
      
      setBlockDialogOpen(false);
      setBlockReason('');
      setBlockDuration('7');
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      setUserError('Failed to block user');
    } finally {
      setIsSubmitting(false);
    }
  }, [blockReason, blockDuration, blockDurationUnit, fetchUsers]);

  const handleUnblockUser = useCallback(async (user: ExtendedUser) => {
    try {
      await apiService.unblockUser(user._id);
      await fetchUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      setUserError('Failed to unblock user');
    }
  }, [fetchUsers]);

  const handleNewContest = useCallback(() => {
    setSelectedContestId(null);
    setContestForm({
      title: '',
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      duration: 120,
      problems: [],
      participants: [],
      isPublic: true, // Set to public by default
      status: 'upcoming',
      maxParticipants: 100,
      entryFee: 0,
      prizePool: 0,
      rules: [],
      tags: [],
      prizeDistribution: { first: 50, second: 30, third: 20 }
    });
    
    // Ensure we have the latest problems loaded
    if (availableProblems.length === 0) {
      const loadProblems = async () => {
        try {
          const response = await apiService.get<{ problems?: Problem[] }>('/admin/problems?limit=1000');
          const problems = Array.isArray(response) ? response : (response?.problems || []);
          setAvailableProblems(problems);
        } catch (error) {
          console.error('Error loading problems:', error);
        }
      };
      loadProblems();
    }
    
    setShowContestForm(true);
  }, []);

  const handleEditContest = useCallback((contest: Contest) => {
    setSelectedContestId(contest._id);
    setContestForm({
      ...contest,
      startTime: new Date(contest.startTime).toISOString().slice(0, 16),
      endTime: new Date(contest.endTime).toISOString().slice(0, 16),
      problems: Array.isArray(contest.problems) ? [...contest.problems] : [],
      isPublic: true // Force public for all contests
    });
    
    // Ensure we have the latest problems loaded
    if (availableProblems.length === 0) {
      const loadProblems = async () => {
        try {
          const response = await apiService.get<{ problems?: Problem[] }>('/admin/problems?limit=1000');
          const problems = Array.isArray(response) ? response : (response?.problems || []);
          setAvailableProblems(problems);
        } catch (error) {
          console.error('Error loading problems:', error);
        }
      };
      loadProblems();
    }
    
    setShowContestForm(true);
  }, []);

  // Load all available problems when component mounts
  useEffect(() => {
    const loadAllProblems = async () => {
      try {
        const response = await apiService.get<ApiResponse<Problem>>('/admin/problems?limit=1000');
        const problems = Array.isArray(response) ? response : (response?.problems || []);
        setAvailableProblems(problems);
      } catch (error) {
        console.error('Error loading problems:', error);
      }
    };
    
    loadAllProblems();
  }, []);

  // Also fetch problems when the contests tab is active
  useEffect(() => {
    if (activeTab === 'contests') {
      fetchProblems();
    }
  }, [activeTab, fetchProblems]);

  const handleDeleteContest = useCallback(async (contestId: string) => {
    if (window.confirm('Are you sure you want to delete this contest?')) {
      try {
        await apiService.deleteContest(contestId);
        await fetchContests();
      } catch (error) {
        console.error('Error deleting contest:', error);
        setContestError('Failed to delete contest');
      }
    }
  }, [fetchContests]);

  const handleManageContestProblems = useCallback((contestId: string) => {
    setSelectedContestId(contestId);
    setShowContestProblemManager(true);
  }, []);

  const handleContestProblemsUpdated = useCallback(() => {
    fetchContests();
  }, [fetchContests]);

  const handleDeleteProblem = useCallback(async (problemId: string) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      try {
        await apiService.deleteProblem(problemId);
        await fetchProblems();
        try { toast.success?.('Problem deleted'); } catch {}
      } catch (error) {
        console.error('Error deleting problem:', error);
        setProblemError('Failed to delete problem');
        try { toast.error?.('Failed to delete problem'); } catch {}
      }
    }
  }, [fetchProblems]);

  const handleToggleProblemPublish = useCallback(async (problem: Problem) => {
    try {
      await apiService.updateProblem(problem._id, { isPublished: !problem.isPublished });
      await fetchProblems();
      try { toast.success?.(problem.isPublished ? 'Moved to Draft' : 'Published'); } catch {}
    } catch (e) {
      console.error('Toggle publish error:', e);
      try { toast.error?.('Failed to update status'); } catch {}
    }
  }, [fetchProblems]);

  // Format date helper
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  // Get contest status
  const getContestStatus = useCallback((contest: Contest) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  }, []);

  // Render tabs
  const renderTabs = () => (
    <div className="bg-white border-b border-blue-100">
      <nav className="px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: Shield },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'problems', label: 'Problems', icon: Code },
            { key: 'contests', label: 'Contests', icon: Trophy },
            { key: 'jobs', label: 'Jobs', icon: Calendar }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  // Problem Form Modal component
  const ProblemFormModal = () => {
    const [saving, setSaving] = useState(false);
    const todayUtc = (() => {
      const d = new Date();
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();
    const [dailyDate, setDailyDate] = useState<string>(todayUtc);
    const [problemForm, setProblemForm] = useState({
      title: '',
      description: '',
      difficulty: 'Medium',
      points: 100,
      category: '',
      isPremium: false,
      isPublished: true,
      tags: [] as string[],
      constraints: [''],
      examples: [
        {
          input: '',
          output: '',
          explanation: ''
        }
      ],
      testCases: [
        {
          input: '',
          output: '',
          expectedOutput: '',
          isHidden: false
        }
      ],
      starterCode: {
        javascript: 'function solution() {\n  // Your code here\n  return;\n}',
        python: 'def solution():\n    # Your code here\n    return',
        java: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}'
      },
      solution: ''
    });

    // Prefill form when editing an existing problem
    useEffect(() => {
      if (selectedProblem) {
        setProblemForm({
          title: selectedProblem.title || '',
          description: selectedProblem.description || '',
          difficulty: (selectedProblem.difficulty as any) || 'Medium',
          points: selectedProblem.points || 100,
          category: (selectedProblem as any).category || '',
          isPremium: !!selectedProblem.isPremium,
          isPublished: (selectedProblem as any).isPublished ?? true,
          tags: (selectedProblem as any).tags || [],
          constraints: (selectedProblem as any).constraints || [''],
          examples: (selectedProblem as any).examples || [{ input: '', output: '', explanation: '' }],
          testCases: selectedProblem.testCases?.length ? selectedProblem.testCases.map(tc => ({
            input: tc.input || '',
            output: tc.output || '',
            expectedOutput: (tc as any).expectedOutput || tc.output || '',
            isHidden: !!tc.isHidden,
          })) : [{ input: '', output: '', expectedOutput: '', isHidden: false }],
          starterCode: (selectedProblem as any).starterCode || {
            javascript: 'function solution() {\n  // Your code here\n  return;\n}',
            python: 'def solution():\n    # Your code here\n    return',
            java: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}'
          },
          solution: (selectedProblem as any).solution || ''
        });
      } else {
        // Reset to defaults when creating new
        setProblemForm(prev => ({ ...prev, title: '', description: '', category: '', tags: [], solution: '' }));
      }
    }, [selectedProblem]);

    const handleProblemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target as HTMLInputElement;
      setProblemForm(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setProblemForm(prev => ({
        ...prev,
        [name]: checked
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // Basic validation
      if (!problemForm.title.trim()) {
        try { toast.error?.('Title is required'); } catch {}
        return;
      }
      if (!problemForm.description.trim()) {
        try { toast.error?.('Description is required'); } catch {}
        return;
      }
      if (!Number.isFinite(Number(problemForm.points)) || Number(problemForm.points) < 1) {
        try { toast.error?.('Points must be at least 1'); } catch {}
        return;
      }
      try {
        setSaving(true);
        const payload: any = {
          title: problemForm.title.trim(),
          description: problemForm.description.trim(),
          difficulty: problemForm.difficulty as any,
          points: Number(problemForm.points) || 0,
          category: problemForm.category?.trim() || undefined,
          isPremium: !!problemForm.isPremium,
          isPublished: !!problemForm.isPublished,
          tags: Array.isArray(problemForm.tags) ? problemForm.tags : [],
          constraints: Array.isArray(problemForm.constraints) ? problemForm.constraints : [],
          examples: Array.isArray(problemForm.examples) ? problemForm.examples : [],
          testCases: Array.isArray(problemForm.testCases) ? problemForm.testCases : [],
          starterCode: problemForm.starterCode || {},
          solution: problemForm.solution || ''
        };

        if (selectedProblem?._id) {
          await apiService.updateProblem(selectedProblem._id, payload);
          try { toast.success?.('Problem updated'); } catch {}
        } else {
          await apiService.createProblem(payload);
          try { toast.success?.('Problem created'); } catch {}
        }

        // Refresh list and close
        await fetchProblems();
        setSelectedProblem(null);
        setShowProblemForm(false);
      } catch (err) {
        console.error('Error saving problem:', err);
        try { toast.error?.((err as Error)?.message || 'Failed to save problem'); } catch {}
      } finally {
        setSaving(false);
      }
    };

    return (
      <Transition show={showProblemForm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowProblemForm(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3">
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white p-4 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-base font-medium leading-5 text-blue-900 mb-4">
                  {selectedProblem ? 'Edit Problem' : 'Create New Problem'}
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-blue-700">Basic Information</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">
                          Problem Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          required
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                          value={problemForm.title}
                          onChange={handleProblemInputChange}
                          placeholder="Enter problem title"
                        />
                      </div>
                      <div>
                        <label htmlFor="difficulty" className="block text-xs font-medium text-gray-700 mb-1">
                          Difficulty *
                        </label>
                        <select
                          id="difficulty"
                          name="difficulty"
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                          value={problemForm.difficulty}
                          onChange={handleProblemInputChange}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="points" className="block text-xs font-medium text-gray-700 mb-1">
                          Points *
                        </label>
                        <input
                          type="number"
                          id="points"
                          name="points"
                          min="1"
                          required
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                          value={problemForm.points}
                          onChange={handleProblemInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                          value={problemForm.category}
                          onChange={handleProblemInputChange}
                          placeholder="e.g., Array, String"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="isPremium"
                          name="isPremium"
                          type="checkbox"
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          checked={problemForm.isPremium}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="isPremium" className="ml-2 block text-xs text-gray-700">
                          Premium Problem
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="isPublished"
                          name="isPublished"
                          type="checkbox"
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          checked={problemForm.isPublished}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="isPublished" className="ml-2 block text-xs text-gray-700">
                          Published
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div>
                    <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">
                      Problem Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      value={problemForm.description}
                      onChange={handleProblemInputChange}
                      placeholder="Enter detailed problem description with examples"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use Markdown for formatting. Include constraints and examples in the description.
                    </p>
                  </div>

                  {/* Examples */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-blue-700">Examples</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemForm(prev => ({
                            ...prev,
                            examples: [...prev.examples, { input: '', output: '', explanation: '' }]
                          }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        + Add Example
                      </button>
                    </div>
                    {problemForm.examples.map((example, index) => (
                      <div key={index} className="mb-3 p-2 border border-gray-200 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Input {index + 1}
                            </label>
                            <textarea
                              className="w-full px-2 py-1 text-xs border border-blue-200 rounded text-black bg-white"
                              rows={2}
                              value={example.input}
                              onChange={(e) => {
                                const newExamples = [...problemForm.examples];
                                newExamples[index].input = e.target.value;
                                setProblemForm(prev => ({
                                  ...prev,
                                  examples: newExamples
                                }));
                              }}
                              placeholder="Input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Output {index + 1}
                            </label>
                            <textarea
                              className="w-full px-2 py-1 text-xs border border-blue-200 rounded text-black bg-white"
                              rows={2}
                              value={example.output}
                              onChange={(e) => {
                                const newExamples = [...problemForm.examples];
                                newExamples[index].output = e.target.value;
                                setProblemForm(prev => ({
                                  ...prev,
                                  examples: newExamples
                                }));
                              }}
                              placeholder="Expected output"
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Explanation
                          </label>
                          <textarea
                            className="w-full px-2 py-1 text-xs border border-blue-200 rounded text-black bg-white"
                            rows={2}
                            value={example.explanation}
                            onChange={(e) => {
                              const newExamples = [...problemForm.examples];
                              newExamples[index].explanation = e.target.value;
                              setProblemForm(prev => ({
                                ...prev,
                                examples: newExamples
                              }));
                            }}
                            placeholder="Explanation (optional)"
                          />
                        </div>
                        {problemForm.examples.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setProblemForm(prev => ({
                                  ...prev,
                                  examples: prev.examples.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                            >
                              Remove Example
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Test Cases */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-blue-700">Test Cases</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemForm(prev => ({
                            ...prev,
                            testCases: [
                              ...prev.testCases,
                              { input: '', output: '', expectedOutput: '', isHidden: false }
                            ]
                          }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        + Add Test Case
                      </button>
                    </div>
                    {problemForm.testCases.map((testCase, index) => (
                      <div key={index} className="mb-3 p-2 border border-gray-200 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Input {index + 1}
                            </label>
                            <textarea
                              className="w-full px-2 py-1 text-xs border border-blue-200 rounded text-black bg-white"
                              rows={2}
                              value={testCase.input}
                              onChange={(e) => {
                                const newTestCases = [...problemForm.testCases];
                                newTestCases[index].input = e.target.value;
                                setProblemForm(prev => ({
                                  ...prev,
                                  testCases: newTestCases
                                }));
                              }}
                              placeholder="Input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Expected Output {index + 1}
                            </label>
                            <textarea
                              className="w-full px-2 py-1 text-xs border border-blue-200 rounded text-black bg-white"
                              rows={2}
                              value={testCase.expectedOutput}
                              onChange={(e) => {
                                const newTestCases = [...problemForm.testCases];
                                newTestCases[index].expectedOutput = e.target.value;
                                setProblemForm(prev => ({
                                  ...prev,
                                  testCases: newTestCases
                                }));
                              }}
                              placeholder="Expected output"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input
                              id={`isHidden-${index}`}
                              type="checkbox"
                              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={testCase.isHidden}
                              onChange={(e) => {
                                const newTestCases = [...problemForm.testCases];
                                newTestCases[index].isHidden = e.target.checked;
                                setProblemForm(prev => ({
                                  ...prev,
                                  testCases: newTestCases
                                }));
                              }}
                            />
                            <label htmlFor={`isHidden-${index}`} className="ml-2 block text-xs text-gray-700">
                              Hidden Test Case
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProblemForm(prev => ({
                                ...prev,
                                testCases: prev.testCases.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                            disabled={problemForm.testCases.length <= 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-xs font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                        setProblemForm(prev => ({
                          ...prev,
                          tags
                        }));
                      }}
                      placeholder="e.g., array, dynamic programming, recursion"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate tags with commas
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <label htmlFor="solution" className="block text-xs font-medium text-gray-700 mb-1">
                      Solution Explanation
                    </label>
                    <textarea
                      id="solution"
                      name="solution"
                      rows={3}
                      className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      value={problemForm.solution}
                      onChange={handleProblemInputChange}
                      placeholder="Explain the optimal solution approach"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowProblemForm(false)}
                      className="px-3 py-1.5 border-2 border-blue-500 rounded-md text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 border-2 border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      {selectedProblem ? 'Update Problem' : 'Create Problem'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
  // Contest Form Modal component
  const ContestFormModal = () => (
    <Transition show={showContestForm} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setShowContestForm(false)}>
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-4 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-base font-medium leading-5 text-blue-900 mb-3">
                {selectedContestId ? 'Edit Contest' : 'Create New Contest'}
              </Dialog.Title>
              <form onSubmit={handleSubmitContest} className="space-y-4">
                <div>
                  <label htmlFor="contestTitle" className="block text-xs font-medium text-blue-700 mb-1">
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="contestTitle"
                    required
                    className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                    value={contestForm.title}
                    onChange={handleContestInputChange}
                    placeholder="Enter contest title"
                  />
                </div>

                <div>
                  <label htmlFor="contestDescription" className="block text-xs font-medium text-blue-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    id="contestDescription"
                    rows={3}
                    required
                    className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-vertical text-xs"
                    value={contestForm.description}
                    onChange={handleContestInputChange}
                    placeholder="Enter contest description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-medium text-blue-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      id="startTime"
                      required
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.startTime}
                      onChange={handleContestInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-xs font-medium text-blue-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      id="endTime"
                      required
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.endTime}
                      onChange={handleContestInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="duration" className="block text-xs font-medium text-blue-700 mb-1">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      id="duration"
                      min="30"
                      step="30"
                      required
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.duration}
                      onChange={handleContestInputChange}
                      placeholder="e.g., 120"
                    />
                  </div>
                  <div>
                    <label htmlFor="entryFee" className="block text-xs font-medium text-blue-700 mb-1">
                      Entry Fee (₹ INR)
                    </label>
                    <input
                      type="number"
                      name="entryFee"
                      id="entryFee"
                      min="0"
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.entryFee}
                      onChange={handleContestInputChange}
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label htmlFor="prizePool" className="block text-xs font-medium text-blue-700 mb-1">
                      Prize Pool (₹ INR)
                    </label>
                    <input
                      type="number"
                      name="prizePool"
                      id="prizePool"
                      min="0"
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.prizePool}
                      onChange={handleContestInputChange}
                      placeholder="e.g., 1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="maxParticipants" className="block text-xs font-medium text-blue-700 mb-1">
                      Max Participants *
                    </label>
                    <input
                      type="number"
                      name="maxParticipants"
                      id="maxParticipants"
                      min="1"
                      required
                      className="mt-1 block w-full px-2 py-1.5 bg-white text-black border-2 border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-xs"
                      value={contestForm.maxParticipants}
                      onChange={handleContestInputChange}
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Contest Visibility
                    </label>
                    <div className="mt-1">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <Shield className={`h-4 w-4 mr-2 ${contestForm.isPublic ? 'text-green-600' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${contestForm.isPublic ? 'text-green-800' : 'text-gray-700'}`}>
                            {contestForm.isPublic ? 'Public Contest' : 'Private Contest'}
                          </span>
                        </div>
                        <Switch
                          checked={contestForm.isPublic}
                          onChange={(checked) => setContestForm(prev => ({
                            ...prev,
                            isPublic: checked
                          }))}
                          className={`${
                            contestForm.isPublic ? 'bg-green-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          <span
                            className={`${
                              contestForm.isPublic ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {contestForm.isPublic 
                          ? 'This contest will be visible to all users on the contests page.'
                          : 'This contest will only be visible to users with a direct link.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-2">
                    Select Problems
                  </label>
                  <div className="max-h-48 overflow-y-auto border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                    {availableProblems.length > 0 ? (
                      availableProblems.map((problem) => (
                        <div key={problem._id} className="flex items-center mb-2 p-2 hover:bg-blue-100 rounded-md">
                          <input
                            type="checkbox"
                            id={`problem-${problem._id}`}
                            checked={contestForm.problems.includes(problem._id)}
                            onChange={(e) => handleProblemSelect(problem._id, e.target.checked)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          />
                          <label htmlFor={`problem-${problem._id}`} className="ml-2 text-xs text-gray-700">
                            <span className="font-medium">{problem.title}</span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" 
                                  style={{
                                    backgroundColor: problem.difficulty === 'Easy' ? '#E6F7E6' : 
                                                  problem.difficulty === 'Medium' ? '#FFF5E6' : '#FFE6E6',
                                    color: problem.difficulty === 'Easy' ? '#1F7F1F' : 
                                           problem.difficulty === 'Medium' ? '#CC7A00' : '#CC0000'
                                  }}>
                              {problem.difficulty}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">{problem.points} points</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-3">No problems available. Please create some problems first.</p>
                    )}
                  </div>
                  {contestForm.problems.length > 0 && (
                    <p className="mt-2 text-xs text-blue-600 font-medium">
                      {contestForm.problems.length} problem{contestForm.problems.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowContestForm(false)}
                    className="px-3 py-1.5 border-2 border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !contestForm.title || !contestForm.description}
                    className={`px-3 py-1.5 border-2 border-transparent rounded-md shadow-sm text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                      isSubmitting || !contestForm.title || !contestForm.description
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" />
                        {selectedContestId ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : selectedContestId ? 'Update Contest' : 'Create Contest'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Check if user is admin
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-blue-100">
          <div className="px-3 sm:px-4 lg:px-6 py-3">
            <h1 className="text-lg sm:text-xl font-bold text-blue-900">Admin Panel</h1>
            <p className="mt-1 text-xs text-blue-600">Manage your platform</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-3 sm:mx-4 lg:mx-6 mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-xs">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Users Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-blue-100">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-blue-700 truncate">Total Users</dt>
                        <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                          {statsLoading ? (
                            <span className="animate-pulse text-xs">Loading...</span>
                          ) : statsError ? (
                            <span className="text-red-600 text-xs">Error</span>
                          ) : (
                            stats?.totalUsers || 0
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs">
                    {statsLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : statsError ? (
                      <span className="text-red-600">Error</span>
                    ) : (
                      <>
                        <span className="text-green-600 font-medium">{stats?.activeUsers || 0}</span>
                        <span className="text-blue-600 ml-1">active</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-red-600 font-medium">{stats?.blockedUsers || 0}</span>
                        <span className="text-blue-600 ml-1">blocked</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-blue-100">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Code className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-blue-700 truncate">Problems</dt>
                        <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                          {statsLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse"></span>
                          ) : statsError ? (
                            <span className="text-red-600 text-xs">Error</span>
                          ) : (
                            <span>{stats?.totalProblems || 0}</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-blue-100">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-blue-700 truncate">Contests</dt>
                        <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                          {statsLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse"></span>
                          ) : statsError ? (
                            <span className="text-red-600 text-xs">Error</span>
                          ) : (
                            <span>{stats?.totalContests || 0}</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-blue-100">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-blue-700 truncate">Submissions</dt>
                        <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                          {statsLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse"></span>
                          ) : statsError ? (
                            <span className="text-red-600 text-xs">Error</span>
                          ) : (
                            <span>{stats?.totalSubmissions?.toLocaleString() || '0'}</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              <div className="bg-white shadow-lg rounded-lg border border-blue-100">
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-blue-800">Recent Activity</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-medium text-xs">
                              {user.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-blue-900 font-medium text-xs truncate">{user.username}</p>
                            <p className="text-blue-600 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-medium text-blue-800">Quick Actions</h4>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => setShowProblemForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Add New Problem</span>
                  </button>
                  <button
                    onClick={() => setShowContestForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Create Contest</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin debug: Email tester */}
            <OverviewDebugEmailCard />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Job Postings</h3>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <JobsList />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">User Management</h3>
              <p className="mt-1 text-xs text-blue-600">
                {userPagination.total} user{userPagination.total !== 1 ? 's' : ''} found
                {userPagination.search ? ` matching "${userPagination.search}"` : ''}
              </p>
            </div>
            {/* Responsive search bar */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-6 sm:pl-8 pr-3 py-1.5 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  value={userPagination.search}
                  onChange={(e) => setUserPagination(prev => ({ ...prev, search: e.target.value }))}
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-blue-400" />
              </div>
              <button
                onClick={handleUserSearch}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs whitespace-nowrap"
              >
                Search
              </button>
            </div>
            {/* Responsive table */}
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">User</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Status</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Rank</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {isUserLoading ? (
                      <tr>
                        <td colSpan={5} className="px-2 sm:px-4 py-3 text-center text-xs text-blue-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 sm:px-4 py-3 text-center text-xs text-blue-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        // Skip rendering admin users
                        if (user.isAdmin) return null;
                        
                        const isBlocked = user.isBlocked && (user.blockedUntil ? new Date(user.blockedUntil) > new Date() : true);
                        return (
                          <tr key={user._id} className="hover:bg-blue-25">
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-blue-100 flex-shrink-0"
                                  />
                                ) : (
                                  <UserAvatar username={user.username} />
                                )}
                                <div className="ml-2 min-w-0 flex-1">
                                  <p className="text-blue-900 font-medium text-xs sm:text-sm truncate">
                                    <Link to={`/u/${user.username}`} className="hover:underline">{user.username}</Link>
                                  </p>
                                  <p className="text-blue-600 text-xs truncate sm:hidden">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-xs text-blue-900 truncate max-w-xs">{user.email}</div>
                              <div className="text-xs">
                                {((user as any).isEmailVerified ?? user.isVerified) ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs">Verified</span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">Unverified</span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {user.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                              {user.isBlocked && user.blockReason && (
                                <div className="mt-1 text-xs text-red-700 truncate max-w-xs">Reason: {user.blockReason}</div>
                              )}
                              {user.isBlocked && user.blockedUntil && (
                                <div className="mt-1 text-xs text-amber-700">
                                  Until: {new Date(user.blockedUntil).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                              {!user.isAdmin && (user.ranking || (user as any).rank) ? (
                                <span className="px-1.5 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                  #{user.ranking || (user as any).rank}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex justify-end">
                                {isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="Unblock User"
                                  >
                                    <Unlock className="h-3 w-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setBlockDialogOpen(true);
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Block User"
                                  >
                                    <Lock className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
           {/* Responsive Pagination */}
           {userPagination.total > userPagination.limit && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2 bg-blue-50 border-t border-blue-100 rounded-b-lg space-y-2 sm:space-y-0">
                <div className="text-xs text-blue-700 text-center sm:text-left">
                  Showing <span className="font-medium">
                    {(userPagination.page - 1) * userPagination.limit + 1}
                  </span> to{' '}
                  <span className="font-medium">
                    {Math.min(userPagination.page * userPagination.limit, userPagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{userPagination.total}</span> results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleUserPageChange(userPagination.page - 1)}
                    disabled={userPagination.page === 1}
                    className="relative inline-flex items-center px-2 sm:px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="inline-flex items-center px-2 py-1 text-xs text-blue-700">
                    Page {userPagination.page} of {Math.ceil(userPagination.total / userPagination.limit)}
                  </span>
                  <button
                    onClick={() => handleUserPageChange(userPagination.page + 1)}
                    disabled={userPagination.page * userPagination.limit >= userPagination.total}
                    className="relative inline-flex items-center px-2 sm:px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Manage Problems</h3>
              <button
                onClick={() => setShowProblemForm(true)}
                className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs w-full sm:w-auto"
              >
                <Plus className="h-3 w-3" />
                <span>Add Problem</span>
              </button>
            </div>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 px-3 sm:px-0">
                <p className="text-xs text-blue-600">
                  {problemPagination.total} problem{problemPagination.total !== 1 ? 's' : ''} found
                  {problemPagination.search ? ` matching "${problemPagination.search}"` : ''}
                </p>
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search problems..."
                    className="w-full pl-6 pr-3 py-1.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    value={problemPagination.search}
                    onChange={(e) => setProblemPagination(prev => ({ ...prev, search: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleProblemSearch()}
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-blue-400" />
                </div>
              </div>

              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Title</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider hidden sm:table-cell">Difficulty</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Status</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {isProblemsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-2 sm:px-4 py-3 text-center text-xs text-blue-500">
                          Loading problems...
                        </td>
                      </tr>
                    ) : problems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 sm:px-4 py-3 text-center text-xs text-blue-500">
                          No problems found
                        </td>
                      </tr>
                    ) : (
                      problems.map((problem) => (
                        <tr key={problem._id} className="hover:bg-blue-25">
                          <td className="px-2 sm:px-4 py-3">
                            <div className="text-xs font-medium text-blue-900">{problem.title}</div>
                            <div className="text-xs text-blue-600 truncate max-w-xs">{problem.description?.substring(0, 80)}{problem.description && problem.description.length > 80 ? '...' : ''}</div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                            <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {problem.difficulty ? 
                                problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 
                                'N/A'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              problem.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {problem.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right">
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedProblem(problem);
                                  setShowProblemForm(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Problem"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteProblem(problem._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Problem"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {problemPagination.total > problemPagination.limit && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-3 py-1.5 bg-blue-50 border-t border-blue-100 rounded-b-lg space-y-1 sm:space-y-0 mt-2">
                  <div className="text-xs text-blue-700 text-center sm:text-left">
                    Showing <span className="font-medium">
                      {(problemPagination.page - 1) * problemPagination.limit + 1}
                    </span> to{' '}
                    <span className="font-medium">
                      {Math.min(problemPagination.page * problemPagination.limit, problemPagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{problemPagination.total}</span> results
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleProblemPageChange(problemPagination.page - 1)}
                      disabled={problemPagination.page === 1}
                      className="relative inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="inline-flex items-center px-2 py-1 text-xs text-blue-700">
                      Page {problemPagination.page} of {Math.ceil(problemPagination.total / problemPagination.limit)}
                    </span>
                    <button
                      onClick={() => handleProblemPageChange(problemPagination.page + 1)}
                      disabled={problemPagination.page * problemPagination.limit >= problemPagination.total}
                      className="relative inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contests' && (
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-blue-900">Manage Contests</h3>
                {!isContestsLoading && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {contestPagination.search ? (
                      `Found ${contests.length} of ${contestPagination.total} contests matching "${contestPagination.search}"`
                    ) : (
                      `Showing ${contests.length} of ${contestPagination.total} contests`
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search contests..."
                    className="w-full sm:w-36 pl-5 pr-2 py-1 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    value={contestPagination.search}
                    onChange={(e) => {
                      setContestPagination(prev => ({
                        ...prev,
                        search: e.target.value,
                        page: 1
                      }));
                    }}
                  />
                  <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
                <button
                  onClick={() => {
                    setEditingContest(null);
                    setSelectedContestId(null);
                    setContestForm({
                      title: '',
                      description: '',
                      isPublic: true,
                      startTime: new Date().toISOString().slice(0, 16),
                      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
                      duration: 120,
                      problems: [],
                      participants: [],
                      status: 'upcoming',
                      maxParticipants: 100,
                      entryFee: 0,
                      prizePool: 0,
                      rules: [],
                      tags: [],
                      prizeDistribution: { first: 50, second: 30, third: 20 }
                    });
                    setShowContestForm(true);
                  }}
                  className="flex items-center justify-center space-x-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs w-full sm:w-auto"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create Contest</span>
                </button>
              </div>
            </div>

            {/* Contest Error Display */}
            {contestError && (
              <div className="p-2.5 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{contestError}</span>
                </div>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {isContestsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : contests.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contests found</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {contestPagination.search
                      ? `No contests match your search "${contestPagination.search}". Try a different search term.`
                      : 'Get started by creating a new contest.'}
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingContest(null);
                        setSelectedContestId(null);
                        setContestForm({
                          title: '',
                          description: '',
                          isPublic: true,
                          startTime: new Date().toISOString().slice(0, 16),
                          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
                          duration: 120,
                          problems: [],
                          participants: [],
                          status: 'upcoming',
                          maxParticipants: 100,
                          entryFee: 0,
                          prizePool: 0,
                          rules: [],
                          tags: [],
                          prizeDistribution: { first: 50, second: 30, third: 20 }
                        });
                        setShowContestForm(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="-ml-1 mr-2 h-4 w-4" />
                      New Contest
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contest
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timing
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-4 py-2">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contests.map((contest) => {
                        const contestStatus = getContestStatus(contest);
                        
                        return (
                          <tr key={contest._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 max-w-xs">{contest.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-2 max-w-xs">{contest.description}</div>
                              <div className="mt-1 flex items-center space-x-2">
                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                  contest.isPublic 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {contest.isPublic ? 'Public' : 'Private'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center mb-1">
                                  <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="text-xs">{contest.duration} min</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Start: {formatDate(contest.startTime)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  End: {formatDate(contest.endTime)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="text-xs">{contest.problems?.length || 0} problems</div>
                                <div className="text-xs">{contest.participants?.length || 0}/{contest.maxParticipants} participants</div>
                                <div className="text-xs text-gray-500">
                                  Fee: {walletService.formatCurrency(contest.entryFee, 'INR')} • Prize: {walletService.formatCurrency(contest.prizePool, 'INR')}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                contestStatus === 'ongoing' 
                                  ? 'bg-green-100 text-green-800' 
                                  : contestStatus === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contestStatus === 'ongoing' ? 'Live' : contestStatus === 'completed' ? 'Ended' : 'Upcoming'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-1">
                                <button
                                  onClick={() => handleEditContest(contest)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="Edit Contest"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleManageContestProblems(contest._id)}
                                  className="text-purple-600 hover:text-purple-900 p-1"
                                  title="Manage Problems"
                                >
                                  <Code className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContest(contest._id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete Contest"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contest Pagination */}
              {contestPagination.total > contestPagination.limit && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2.5 bg-gray-50 border-t border-gray-100 space-y-2 sm:space-y-0">
                  <div className="text-xs text-gray-700 text-center sm:text-left">
                    Showing <span className="font-medium">
                      {(contestPagination.page - 1) * contestPagination.limit + 1}
                    </span> to{' '}
                    <span className="font-medium">
                      {Math.min(contestPagination.page * contestPagination.limit, contestPagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{contestPagination.total}</span> results
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleContestPageChange(contestPagination.page - 1)}
                      disabled={contestPagination.page === 1}
                      className="relative inline-flex items-center px-2.5 sm:px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="inline-flex items-center px-2 py-1 text-xs text-gray-700">
                      Page {contestPagination.page} of {Math.ceil(contestPagination.total / contestPagination.limit)}
                    </span>
                    <button
                      onClick={() => handleContestPageChange(contestPagination.page + 1)}
                      disabled={contestPagination.page * contestPagination.limit >= contestPagination.total}
                      className="relative inline-flex items-center px-2.5 sm:px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Problem Form Modal */}
        <ProblemFormModal />
        
        {/* Block User Dialog */}
        <Transition show={blockDialogOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setBlockDialogOpen(false)}>
            <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-3 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-3 pb-3 pt-4 text-left shadow-xl transition-all sm:my-6 sm:w-full sm:max-w-md sm:p-5 w-full max-w-sm">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-8 sm:w-8">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="mt-3 text-center sm:ml-3 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-sm font-semibold leading-5 text-gray-900">
                          Block User: {selectedUser?.username}
                        </Dialog.Title>
                        <div className="mt-3 space-y-3">
                          <div>
                            <label htmlFor="blockReason" className="block text-xs font-medium text-gray-700">
                              Reason for blocking *
                            </label>
                            <textarea
                              id="blockReason"
                              rows={2}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs px-2 py-1.5 border"
                              value={blockReason}
                              onChange={(e) => setBlockReason(e.target.value)}
                              placeholder="Enter reason for blocking"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="blockDuration" className="block text-xs font-medium text-gray-700">
                                Duration
                              </label>
                              <input
                                type="number"
                                id="blockDuration"
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs px-2 py-1.5 border"
                                value={blockDuration}
                                onChange={(e) => setBlockDuration(e.target.value)}
                              />
                            </div>
                            <div>
                              <label htmlFor="blockDurationUnit" className="block text-xs font-medium text-gray-700">
                                Unit
                              </label>
                              <select
                                id="blockDurationUnit"
                                className="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
                                value={blockDurationUnit}
                                onChange={(e) => setBlockDurationUnit(e.target.value as 'days' | 'weeks' | 'months')}
                              >
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                                <option value="months">Months</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:justify-end">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto order-2 sm:order-1"
                        onClick={() => selectedUser && handleBlockUser(selectedUser)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Blocking...' : 'Block User'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto order-1 sm:order-2"
                        onClick={() => setBlockDialogOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Contest Problem Manager Modal */}
        {selectedContestId && (
          <ContestProblemManager
            contestId={selectedContestId}
            isOpen={showContestProblemManager}
            onClose={() => setShowContestProblemManager(false)}
            onProblemsUpdated={handleContestProblemsUpdated}
          />
        )}
        
        {/* Contest Form Modal */}
        <ContestFormModal />
      </div>
    </div>
  );
}

export default AdminPanel;