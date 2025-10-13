import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';
import { Contest } from '../types/contest';
import { TestCaseResult } from '@/types/codeExecution';
import { RunTestResponse } from '@/types/contest';
import { Problem } from '../types';
import ContestFeedback from '@/components/Contest/ContestFeedback';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Play, Clock, Loader2, CheckCircle, XCircle, RotateCcw, Check } from 'lucide-react';
import CodeEditor from '../components/common/CodeEditor';

type ContestPhase = 'guidelines' | 'problem' | 'problems' | 'feedback' | 'completed';

// Active indicator threshold for leaderboard (default: 60 seconds)
const ACTIVE_THRESHOLD_MS = 60000;

interface ContestWithProblems extends Omit<Contest, 'problems'> {
  problems: Problem[];  // Override with Problem[] instead of string[]
  rules: string[];  
  prizes: string[]; 
  guidelines?: string;
}

interface ContestState {
  isLoading: boolean;
  error: string | null;
  currentProblemIndex: number;
  phase: ContestPhase;
  testResults: TestCaseResult[];
  hasAgreedToGuidelines: boolean;
  isRegistered: boolean;
  contestHasStarted: boolean;
  contestEnded: boolean;
  isSubmitting: boolean;
  timeLeft: number;
  language: string;
  userCode: Record<string, string>;
  feedback: string;
}

interface ContestSubmission {
  problemId: string;
  code: string;
  language: string;
  testResults?: TestCaseResult[];
  passed?: boolean;
  timestamp: Date;
}

interface TestResults {
  results: Array<{
    passed: boolean;
    input?: any;
    expected?: any;
    output?: any;
    error?: string;
  }>;
  passed: number;
  total: number;
  executionTime: number;
  error?: string;
}

const ContestPage = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const id = contestId; // keep existing references working
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!id) {
    navigate('/contests');
    return null;
  }
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management
  const [contest, setContest] = useState<ContestWithProblems | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentProblemCode, setCurrentProblemCode] = useState<string>('');
  const [phase, setPhase] = useState<ContestPhase>('guidelines');
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [hasAgreedToGuidelines, setHasAgreedToGuidelines] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [contestHasStarted, setContestHasStarted] = useState<boolean>(false);
  const [contestEnded, setContestEnded] = useState<boolean>(false);
  const [userStarted, setUserStarted] = useState<boolean>(false);
  // Separate busy flags so only one action runs at a time
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeMode, setTimeMode] = useState<'untilStart' | 'untilEnd'>('untilStart');
  const [language, setLanguage] = useState<string>('javascript');
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const isAdmin = (() => {
    const u: any = user as any;
    return Boolean(u?.isAdmin) || String(u?.role || '').toLowerCase() === 'admin';
  })();
  // Live contest side-panels
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; time?: string }>>([]);
  const [clarifications, setClarifications] = useState<Array<{ id: string; question: string; answer?: string; at?: string }>>([]);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  // Ask clarification form state
  const [askText, setAskText] = useState<string>('');
  const [askPrivate, setAskPrivate] = useState<boolean>(false);
  const [askVisibility, setAskVisibility] = useState<'all' | 'team'>('all');
  const [askTags, setAskTags] = useState<string>('');
  const [askSubmitting, setAskSubmitting] = useState<boolean>(false);
  // Server time offset (serverNow - clientNow)
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(0);
  // Public (non-hidden) testcases for current problem
  const [publicTestcases, setPublicTestcases] = useState<Array<{ input: string; expectedOutput: string }>>([]);
  // Anchor start time for duration-based countdown (persisted)
  const [timerAnchorMs, setTimerAnchorMs] = useState<number | null>(null);

  // Helper to normalize problem identifier (_id preferred, fallback to id)
  const getProblemId = useCallback((p: Partial<Problem> | { _id?: unknown; id?: unknown } | null | undefined): string | undefined => {
    if (!p) return undefined;
    const maybe: any = p as any;
    if (typeof maybe._id === 'string' && maybe._id) return maybe._id;
    if (typeof maybe.id === 'string' && maybe.id) return maybe.id;
    if (typeof maybe.id === 'number') return String(maybe.id);
    return undefined;
  }, []);

  // Determine if a problem object appears populated (has title/description)
  const isPopulatedProblem = (p: any) => p && (typeof p.title === 'string' || typeof p.description === 'string');

  // Normalizes a mixed array of problem refs or full problems into full Problem objects
  const normalizeProblems = useCallback(async (items: any[]): Promise<Problem[]> => {
    if (!Array.isArray(items) || items.length === 0) return [];
    // If already populated, return as-is (cast)
    if (isPopulatedProblem(items[0])) return items as Problem[];
    // Otherwise fetch each by id
    const ids = items.map((it) => {
      if (typeof it === 'string') return it;
      if (it && typeof it._id === 'string') return it._id;
      if (it && typeof it.id === 'string') return it.id;
      if (it && typeof it.id === 'number') return String(it.id);
      return undefined;
    }).filter(Boolean) as string[];
    const fetched = await Promise.all(ids.map((pid) => apiService.get<Problem>(`/problems/${pid}`)));
    return fetched.filter(Boolean) as Problem[];
  }, []);

  // Load problems for a contest with multiple fallback strategies
  const loadContestProblems = useCallback(async (contestId: string, started?: boolean): Promise<Problem[]> => {
    try {
      const data = await apiService.get<ContestWithProblems>(`/contests/${contestId}?populate=problems`);
      const arr = data?.problems || [];
      const normalized = await normalizeProblems(arr as any[]);
      if (normalized.length > 0) return normalized;
    } catch (e) {
      // ignore and try next
    }
    // Only call strict contest-problems endpoint after contest starts; it enforces start check
    if (started) {
      try {
        const res = await apiService.get<{ problems?: Problem[] }>(`/contest-problems/${contestId}`);
        const arr = res?.problems || [];
        const normalized = await normalizeProblems(arr as any[]);
        return normalized;
      } catch (e: any) {
        // Gracefully ignore 403 'Contest has not started yet'
        return [];
      }
    }
    return [];
  }, [normalizeProblems]);

  // Helper function to get difficulty color class
  const getDifficultyColor = (difficulty: string) => {
    const lowerCaseDiff = difficulty.toLowerCase();
    if (lowerCaseDiff === 'easy') return 'bg-green-100 text-green-800';
    if (lowerCaseDiff === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Handle feedback submission callback
  const handleFeedbackSubmitted = useCallback(() => {
    setShowFeedback(false);
    // Refresh contest data to show updated feedback
    if (id) {
      apiService.get<ContestWithProblems>(`/contests/${id}`)
        .then(contestData => setContest(contestData))
        .catch(error => console.error('Error refreshing contest data:', error));
    }
  }, [id]);

  // Toggle feedback form visibility
  const toggleFeedback = useCallback(() => {
    setShowFeedback(prev => !prev);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const s = Number(seconds);
    if (!isFinite(s) || isNaN(s) || s < 0) return '00:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch contest data with problems populated
        const contestData = await apiService.get<ContestWithProblems>(`/contests/${id}?populate=problems`);
        setContest(contestData);
        // Normalize problems to ensure we have full objects, not just ObjectIds
        const normalized = await loadContestProblems(id, false);
        setProblems(normalized);
        
        if (normalized.length > 0) {
          setCurrentProblem(normalized[0]);
        }
        
        // Do not auto-complete from localStorage; rely on server state or explicit flow

        // Calculate time left
        const now = new Date();
        const startTime = new Date(contestData.startTime);
        const endTime = new Date(contestData.endTime);
        const startValid = !isNaN(startTime.getTime());
        const endValid = !isNaN(endTime.getTime());
        if (!startValid || !endValid) {
          // If times are invalid, keep timer neutral and allow immediate start
          setContestHasStarted(true);
          setTimeLeft(0);
          setTimeMode('untilEnd');
          return;
        }
        
        if (now.getTime() > endTime.getTime() + 1500) { // 1.5s grace beyond end
          // Contest has ended; mark ended but do not auto-navigate to completed page.
          // Let the user see guidelines and a disabled Start button.
          setContestEnded(true);
          setTimeLeft(0);
          setTimeMode('untilEnd');
        } else if (now >= startTime) {
          setContestHasStarted(true);
          const timeLeftInSeconds = Math.max(1, Math.ceil((endTime.getTime() - now.getTime()) / 1000));
          setTimeLeft(timeLeftInSeconds); // ensure at least 1s to avoid instant end flip
          setTimeMode('untilEnd');
        } else {
          const timeLeftInSeconds = Math.max(1, Math.ceil((startTime.getTime() - now.getTime()) / 1000));
          setTimeLeft(timeLeftInSeconds);
          setTimeMode('untilStart');
        }
        
      } catch (error) {
        console.error('Error fetching contest:', error);
        setError('Failed to load contest data');
        toast.error('Failed to load contest data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContestData();
  }, [id]);

  // Sync server time once to compute offset
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.get<any>('/time');
        const serverNow = Number((res?.now ?? res?.data?.now));
        if (Number.isFinite(serverNow)) {
          setClockOffsetMs(serverNow - Date.now());
        }
      } catch {}
    })();
  }, []);

  // On load, only read existing anchor (resume after refresh). Do NOT start until user clicks Start.
  useEffect(() => {
    if (!contest) return;
    const key = `contestTimerStartedAt::${(contest as any)._id || id}`;
    const stored = Number(localStorage.getItem(key));
    if (Number.isFinite(stored) && stored > 0) {
      setTimerAnchorMs(stored);
      setUserStarted(true);
    }
  }, [contest, id]);

  // Dev/admin: reset timer anchor
  const handleResetTimer = useCallback(() => {
    try {
      const key = `contestTimerStartedAt::${(contest as any)?._id || id}`;
      localStorage.removeItem(key);
      setTimerAnchorMs(null);
      setUserStarted(false);
      setTimeLeft(0);
      toast.success('Timer reset. Click Start Contest to begin again.');
    } catch {}
  }, [contest, id]);

  // Handle timer: prefer duration-based countdown from persisted anchor; otherwise use start/end
  useEffect(() => {
    if (!contest) return;

    const computeAndSet = () => {
      try {
        const nowMs = Date.now() + clockOffsetMs;
        const durMin = Number((contest as any).duration);
        if (Number.isFinite(durMin) && durMin > 0 && timerAnchorMs) {
          // Duration-driven mode
          const endMs = timerAnchorMs + durMin * 60 * 1000;
          if (nowMs >= endMs + 1500) {
            setContestHasStarted(true);
            setContestEnded(true);
            setTimeMode('untilEnd');
            setTimeLeft(0);
            return;
          }
          setContestHasStarted(true);
          setContestEnded(false);
          setTimeMode('untilEnd');
          setTimeLeft(Math.max(1, Math.ceil((endMs - nowMs) / 1000)));
          return;
        }

        // Start/end window mode
        let startMs = new Date((contest as any).startTime).getTime();
        let endMs = new Date((contest as any).endTime).getTime();
        // Fallback if times are invalid or equal/reversed
        if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) {
          const durMs = 30 * 60 * 1000; // default 30m
          startMs = nowMs;
          endMs = nowMs + durMs;
          setContestHasStarted(true);
          setTimeMode('untilEnd');
        }
        if (nowMs >= endMs + 1500) {
          setContestHasStarted(true);
          setContestEnded(true);
          setTimeMode('untilEnd');
          setTimeLeft(0);
          return;
        }
        if (nowMs < startMs) {
          setContestHasStarted(false);
          setContestEnded(false);
          setTimeMode('untilStart');
          setTimeLeft(Math.max(1, Math.ceil((startMs - nowMs) / 1000)));
          return;
        }
        // between start and end
        setContestHasStarted(true);
        setContestEnded(false);
        setTimeMode('untilEnd');
        setTimeLeft(Math.max(1, Math.ceil((endMs - nowMs) / 1000)));
      } catch {}
    };

    computeAndSet(); // set immediately on mount
    timerRef.current = setInterval(computeAndSet, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contest, clockOffsetMs, timerAnchorMs]);

  // Poll live leaderboard and clarifications during contest
  useEffect(() => {
    if (!id || !contestHasStarted || contestEnded) return;
    let cancelled = false;
    let interval: any;
    const fetchLive = async () => {
      try {
        setLiveLoading(true);
        // These endpoints may or may not exist; fail silently
        const [lb, cl] = await Promise.allSettled([
          apiService.get<any>(`/contests/${id}/leaderboard`),
          apiService.get<any>(`/contests/${id}/clarifications`),
        ]);
        if (!cancelled) {
          if (lb.status === 'fulfilled') {
            const arr = (lb.value?.leaderboard || lb.value || []) as any[];
            const mapped = arr.map((e: any) => ({
              username: e.username || e.user?.username || 'User',
              score: Number(e.score ?? e.points ?? 0),
              time: e.time || e.submittedAt || e.updatedAt,
            }));
            setLeaderboard(mapped);
          }
          if (cl.status === 'fulfilled') {
            const arr = (cl.value?.clarifications || cl.value || []) as any[];
            const mapped = arr.map((c: any, i: number) => ({
              id: String(c._id || c.id || i),
              question: c.question || c.q || '',
              answer: c.answer || c.a,
              at: c.createdAt || c.at,
            }));
            setClarifications(mapped);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    fetchLive();
    interval = setInterval(fetchLive, 15000);
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, [id, contestHasStarted, contestEnded]);

  const submitClarification = async () => {
    if (!id) return;
    const body = String(askText || '').trim();
    if (body.length < 3) {
      toast.error('Question is too short');
      return;
    }
    try {
      setAskSubmitting(true);
      const tags = askTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 5);
      await apiService.post(`/contests/${id}/clarifications`, {
        question: body,
        isPrivate: askPrivate,
        visibility: askVisibility,
        tags,
      });
      toast.success('Question sent');
      setAskText('');
      setAskTags('');
      setAskPrivate(false);
      setAskVisibility('all');
      // Immediate refresh of clarifications list
      try {
        const cl = await apiService.get<any>(`/contests/${id}/clarifications`);
        const arr = (cl?.clarifications || cl || []) as any[];
        const mapped = arr.map((c: any, i: number) => ({
          id: String(c._id || c.id || i),
          question: c.question || c.q || '',
          answer: c.answer || c.a,
          at: c.createdAt || c.at,
        }));
        setClarifications(mapped);
      } catch {}
    } catch (e: any) {
      if (e?.status === 429 || e?.response?.status === 429) {
        toast.error('Please wait a minute before asking another question.');
      } else {
        toast.error(e?.message || 'Failed to send question');
      }
    } finally {
      setAskSubmitting(false);
    }
  };
  
  // Handle contest phase changes
  const handleStartContest = useCallback(async () => {
    if (!hasAgreedToGuidelines) {
      toast.error('Please agree to the guidelines first');
      return;
    }
    // Re-check using local time vs contest endTime to avoid stale flags
    try {
      const end = new Date((contest as any)?.endTime).getTime();
      if (isFinite(end) && Date.now() > end) {
        toast.error('This contest has ended. You cannot start it now.');
        return;
      }
    } catch {}
    
    // Prefer the local problems state; if it's empty, try a fallback refetch of the populated contest
    let list = problems;
    if (!list || list.length === 0) {
      try {
        list = await loadContestProblems(id!, true);
        setProblems(list);
      } catch (e) {
        // ignore; we'll handle below
      }
    }

    if (list && list.length > 0) {
      console.debug('[Contest] Starting contest with', list.length, 'problems');
      // Inline rendering: set current problem and switch phase
      setProblems(list);
      setCurrentProblemIndex(0);
      setCurrentProblem(list[0]);
      try {
        const starter = (list[0] as any)?.starterCode?.[language] || '';
        const pid = String(getProblemId(list[0]));
        const key = `${pid}::${language}`;
        setUserCode((prev) => ({ ...prev, [key]: starter }));
        setCurrentProblemCode(starter);
      } catch {}
      toast.success('Contest started!');
      setUserStarted(true);
      setPhase('problems');
      // Set duration anchor at start click if using duration and not already set
      try {
        const durMin = Number((contest as any)?.duration);
        if (Number.isFinite(durMin) && durMin > 0 && !timerAnchorMs) {
          const nowServer = Date.now() + clockOffsetMs;
          const key = `contestTimerStartedAt::${(contest as any)?._id || id}`;
          localStorage.setItem(key, String(nowServer));
          setTimerAnchorMs(nowServer);
          setTimeMode('untilEnd');
        }
      } catch {}
      return;
    } else {
      toast.error('No problems available in this contest');
      window.alert('No problems available in this contest. Please contact the contest admin or try again later.');
    }
  }, [hasAgreedToGuidelines, problems, contest, navigate, id, getProblemId]);

  const handleProblemSelect = useCallback((index: number) => {
    const total = problems?.length ?? 0;
    if (index >= 0 && index < total) {
      setCurrentProblemIndex(index);
      const p = problems[index];
      setCurrentProblem(p);
      try {
        const pid = String(getProblemId(p));
        const key = `${pid}::${language}`;
        const saved = userCode[key];
        const starter = (p as any)?.starterCode?.[language] || '';
        setCurrentProblemCode(saved ?? starter ?? '');
      } catch {}
    }
  }, [problems]);

  const handleCodeChange = useCallback((value: string) => {
    const currentProblemData = problems?.[currentProblemIndex];
    if (currentProblemData) {
      const pid = String(getProblemId(currentProblemData));
      const key = `${pid}::${language}`;
      setUserCode((prev) => ({ ...prev, [key]: value }));
    }
    setCurrentProblemCode(value);
  }, [problems, currentProblemIndex, getProblemId, language]);

  // Enrich current problem with full details (description, starterCode) if missing
  useEffect(() => {
    const enrich = async () => {
      const p = problems?.[currentProblemIndex];
      if (!p) return;
      const hasDescription = typeof (p as any)?.description === 'string' && (p as any).description.length > 10;
      if (!hasDescription) {
        try {
          const pid = String(getProblemId(p));
          const full = await apiService.get<any>(`/problems/${pid}`);
          const prob = (full as any)?.problem || full;
          // Replace in problems list immutably
          setProblems((prev) => {
            const copy = [...prev];
            copy[currentProblemIndex] = { ...(copy[currentProblemIndex] as any), ...prob } as any;
            return copy;
          });
          // Update currentProblem and starter code if empty
          setCurrentProblem((prev) => ({ ...(prev as any), ...prob } as any));
          const starter = prob?.starterCode?.[language];
          if (starter && !currentProblemCode) {
            const pid = String(getProblemId(prob));
            const key = `${pid}::${language}`;
            setCurrentProblemCode(starter);
            setUserCode((prev) => ({ ...prev, [key]: starter }));
          }
        } catch (e) {
          // ignore; will still render basic info
        }
      }
    };
    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblemIndex, problems, language]);

  // Fetch public (non-hidden) testcases for the current problem
  useEffect(() => {
    const fetchPublicTests = async () => {
      try {
        const p = problems?.[currentProblemIndex];
        if (!p) { setPublicTestcases([]); return; }
        const pid = String(getProblemId(p));
        const res = await apiService.get<any>(`/problems/${pid}/testcases`);
        const list = (res?.testCases || res || []) as Array<{ input: string; expectedOutput: string }>;
        setPublicTestcases(Array.isArray(list) ? list : []);
      } catch {
        setPublicTestcases([]);
      }
    };
    fetchPublicTests();
  }, [problems, currentProblemIndex, getProblemId]);

  const handleRunTests = useCallback(async (problemId?: string) => {
    const targetProblem = problemId ? problems.find(p => String(getProblemId(p)) === problemId) : currentProblem;
    if (!targetProblem) return;
    if (isRunning || isRunningAll || isSubmitting) return;
    setIsRunning(true);
    try {
      const pid = String(getProblemId(targetProblem));
      const t0 = performance.now();
      // Quick run against sample testcases
      const data: any = await apiService.post<any>(
        `/problems/${pid}/run`,
        { code: userCode[`${pid}::${language}`] || '', language, contestId: id }
      );
      const t1 = performance.now();
      const res = (data?.result || data);
      const out = res?.output ?? res?.run?.output ?? '';
      const execMs = Math.max(0, Math.round(t1 - t0));
      const detailed = Array.isArray(res?.results) ? res.results : [{ passed: true, output: out }];
      setTestResults({
        results: detailed as any,
        passed: Number(res?.testsPassed ?? (detailed.filter((r:any)=>r.passed).length)),
        total: Number(res?.totalTests ?? detailed.length),
        executionTime: execMs,
      } as any);
      toast.success(`Ran in ${execMs} ms`);
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Run failed');
    } finally {
      setIsRunning(false);
    }
  }, [problems, currentProblem, userCode, language, getProblemId, isRunning, isRunningAll, isSubmitting]);

  const handleRunAllTests = useCallback(async () => {
    if (!currentProblem) return;
    if (isRunning || isRunningAll || isSubmitting) return;
    setIsRunningAll(true);
    try {
      const pid = String(getProblemId(currentProblem));
      const t0 = performance.now();
      const data: any = await apiService.post<any>(
        `/problems/${pid}/submit?dryRun=true`,
        { code: userCode[`${pid}::${language}`] || '', language, contestId: id }
      );
      const t1 = performance.now();
      const res = (data?.result || data);
      const execMs = Math.max(0, Math.round(t1 - t0));
      const detailed = Array.isArray(res?.results) ? res.results : [{ passed: res?.status === 'Accepted', output: res?.output ?? '' }];
      setTestResults({
        results: detailed as any,
        passed: Number(res?.testsPassed ?? (detailed.filter((r:any)=>r.passed).length)),
        total: Number(res?.totalTests ?? detailed.length),
        executionTime: execMs,
      } as any);
      const summary = typeof res?.testsPassed === 'number' && typeof res?.totalTests === 'number'
        ? `${res.testsPassed}/${res.totalTests} tests`
        : 'All tests executed';
      toast.success(`All tests: ${summary}`);
    } catch (e: any) {
      const msg = e?.message || 'Failed to run all tests';
      toast.error(msg);
    } finally {
      setIsRunningAll(false);
    }
  }, [currentProblem, language, userCode, id, getProblemId, isRunning, isRunningAll, isSubmitting]);

  const handleSubmitProblem = useCallback(async () => {
    if (!currentProblem) {
      toast.error('No problem selected');
      return;
    }

    if (isRunning || isRunningAll || isSubmitting) return;
    setIsSubmitting(true);
    try {
      interface SubmitResponse {
        success: boolean;
        message?: string;
        // Add other expected response fields here
      }

      const currId = String(getProblemId(currentProblem));
      const response = await apiService.post<SubmitResponse>(`/problems/${currId}/submit`, {
        code: userCode[`${currId}::${language}`] || '',
        language,
        contestId: id
      });

      // The response is already typed as SubmitResponse
      if (response.success) {
        toast.success('Solution submitted successfully!');
        // Move to next problem or feedback phase
        if (currentProblemIndex < problems.length - 1) {
          const nextIndex = currentProblemIndex + 1;
          setCurrentProblemIndex(nextIndex);
          setCurrentProblem(problems[nextIndex]);
        } else {
          setPhase('feedback');
        }
      }
    } catch (error: any) {
      console.error('Error submitting solution:', error);
      const msg = error?.message || (error?.response?.data?.message) || 'Failed to submit solution';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentProblem, userCode, language, id, currentProblemIndex, problems, getProblemId, isRunning, isRunningAll, isSubmitting]);

  // Submit contest (finalize). Backend endpoint is optional; we optimistically move to feedback.
  const handleSubmitContest = useCallback(async () => {
    if (!id) return;
    if (isRunning || isRunningAll || isSubmitting) return;
    setIsSubmitting(true);
    try {
      try {
        await apiService.post(`/contests/${id}/complete`, { at: Date.now() });
      } catch {}
      toast.success('Contest submitted successfully!');
      setPhase('feedback');
    } catch (e: any) {
      toast.error(String(e?.message || 'Failed to submit contest'));
    } finally {
      setIsSubmitting(false);
    }
  }, [id, isRunning, isRunningAll, isSubmitting]);

  // Auto-submit/complete on unload or tab close
  useEffect(() => {
    if (!id) return;
    const handler = () => {
      try {
        // Minimal payload; server endpoint is optional
        const payload = {
          contestId: id,
          userCode,
          language,
          at: Date.now()
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        // Try to notify server if available
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`/contests/${id}/auto-submit`, blob);
        }
        // Do not set local completion flags; server will record auto-submit
      } catch {}
    };
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && contestHasStarted && !contestEnded) handler();
    });
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [id, userCode, language, contestHasStarted, contestEnded]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }

    try {
      await apiService.post(`/contests/${id}/feedback`, {
        feedback: feedback.trim()
      });

      toast.success('Feedback submitted successfully!');
      setPhase('completed');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }, [feedback, id]);

  // When completed, check if current user is in winners (top 10 flag from results)
  useEffect(() => {
    const checkWinner = async () => {
      try {
        if (phase !== 'completed' || !id) return;
        // Try search by username to reduce payload
        const uname = (user as any)?.username;
        const resp = await apiService.get<any>(`/contests/${id}/results`, {
          params: { search: uname || undefined, limit: 50 },
        } as any);
        const data = (resp?.results ? resp : resp?.data) || resp;
        const meId = String((user as any)?._id || (user as any)?.id || '');
        const mine = (data?.results || []).find((r: any) => String(r.userId) === meId);
        setIsWinner(Boolean(mine?.topTen));
        setMyRank(typeof mine?.rank === 'number' ? mine.rank : null);
      } catch {
        setIsWinner(false);
        setMyRank(null);
      }
    };
    checkWinner();
  }, [phase, id, user]);

  // Update current problem when index changes
  useEffect(() => {
    if (problems.length > 0 && currentProblemIndex >= 0 && currentProblemIndex < problems.length) {
      const problem = problems[currentProblemIndex];
      setCurrentProblem(problem);
      const pid = String(getProblemId(problem));
      const key = `${pid}::${language}`;
      const saved = userCode[key];
      const starter = (problem as any)?.starterCode?.[language] || '';
      setCurrentProblemCode(saved ?? starter ?? '');
    }
  }, [currentProblemIndex, problems, userCode, getProblemId, language]);

  const isContestCompleted = contestEnded || phase === 'completed';

  // Add feedback section to the contest page
  const renderFeedbackSection = useCallback(() => {
    if (!isContestCompleted || !contest) return null;
    
    return (
      <div className="mt-8">
        <button 
          onClick={toggleFeedback}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {showFeedback ? 'Hide Feedback' : 'Submit Feedback'}
        </button>
        
        {showFeedback && (
          <ContestFeedback
            contestId={contest._id}
            isContestCompleted={contest.status === 'completed'}
            onFeedbackSubmit={handleFeedbackSubmitted}
          />
        )}
      </div>
    );
  }, [isContestCompleted, contest, showFeedback, toggleFeedback, handleFeedbackSubmitted]);

  // Render loading state
  if (isLoading || !contest) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-blue-700 font-medium">Loading contest...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Guidelines Phase
  if (phase === 'guidelines') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-4 sm:py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl sm:text-3xl font-bold">{contest.title}</CardTitle>
              <CardDescription className="text-blue-100 text-base sm:text-lg">
                Contest Guidelines & Rules
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose max-w-none mb-6 text-gray-700">
                <h2 className="text-xl font-semibold text-blue-800 mb-3">General Guidelines</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Open to all registered users with a verified account. One account per participant.</li>
                  <li>Contest problems will range from Easy to Hard difficulty.</li>
                  <li>All code must be original — plagiarism or copying is strictly prohibited.</li>
                  <li>Collaboration is not allowed unless it’s a team-based contest.</li>
                  <li>Submissions must be made in allowed programming languages only.</li>
                  <li>Multiple submissions are allowed; the last correct one will be considered.</li>
                  <li>Points are awarded based on problem difficulty and test case coverage.</li>
                  <li>Leaderboard ties are broken by earliest correct submission.</li>
                  <li>Cheating, hacking, or multiple accounts may result in disqualification.</li>
                  <li>Winners will be announced after plagiarism checks are completed.</li>
                </ul>
              </div>
  
              {contest.rules && contest.rules.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h2 className="text-xl font-semibold mb-3 text-blue-800">Additional Contest Rules:</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    {contest.rules.map((rule, index) => (
                      <li key={index} className="text-gray-700">{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
  
              <div className="flex items-start mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="agree-guidelines"
                  checked={hasAgreedToGuidelines}
                  onChange={(e) => setHasAgreedToGuidelines(e.target.checked)}
                  className="h-5 w-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <label htmlFor="agree-guidelines" className="ml-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                  I have read and agree to the contest guidelines and rules. I understand that any violation may result in disqualification.
                </label>
              </div>
  
              <div className="flex justify-center">
                <Button
                  onClick={handleStartContest}
                  disabled={!hasAgreedToGuidelines || !contestHasStarted}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-lg font-semibold"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Contest
                </Button>
                {!contestHasStarted && (
                  <p className="mt-2 text-xs text-blue-600">Contest hasn’t started yet. It will begin in {formatTime(Math.max(0, timeLeft))}.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }  

  // Problems Phase
  if (phase === 'problems') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {/* Contest Header */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-blue-200 sticky top-2 z-30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="mb-3 sm:mb-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{contest.title}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Problem {currentProblemIndex + 1} of {problems.length}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:self-start">
                <Button
                  onClick={handleSubmitProblem}
                  disabled={isRunning || isRunningAll || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-auto"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Solution</>
                  )}
                </Button>
                <Button
                  onClick={handleSubmitContest}
                  variant="secondary"
                  disabled={isSubmitting}
                  className="px-3 py-2 h-auto"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finishing...</>
                  ) : (
                    <>Submit Contest</>
                  )}
                </Button>
              </div>
            </div>
            {/* New running clock bar */}
            <div className="mt-3">
              <div className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-50 via-yellow-50 to-orange-50 border border-emerald-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{contestHasStarted && !contestEnded ? 'Time is running' : (timeMode === 'untilStart' ? 'Starts in' : 'Contest ended')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  <span className="font-mono font-bold text-orange-800 text-lg">{formatTime(Math.max(0, timeLeft))}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main layout: left content + right sidebar leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">

            {/* Center: Problems Tabs and content */}
            <Card className="shadow-lg border-blue-200">
              <Tabs value={currentProblem ? String(getProblemId(currentProblem)) : undefined} onValueChange={(value) => {
                const index = problems.findIndex(p => String(getProblemId(p)) === value);
                if (index >= 0) {
                  setCurrentProblemIndex(index);
                  setCurrentProblem(problems[index]);
                }
              }}>
                <TabsList className="w-full bg-blue-100 p-1 h-auto flex-wrap gap-1">
                  {problems.map((problem, index) => (
                    <TabsTrigger 
                      key={String(getProblemId(problem))}
                      value={String(getProblemId(problem))}
                      className="py-2 px-3 text-sm sm:text-base whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Problem {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {problems.map((problem) => (
                  <TabsContent key={String(getProblemId(problem))} value={String(getProblemId(problem))} className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
                      {/* Problem Description */}
                      <div className="space-y-4 min-w-0 break-words">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{problem.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium self-start ${getDifficultyColor(problem.difficulty)}`}>
                              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                            </span>
                          </div>
                          
                          {/* Collapsible on small screens, full on lg+ */}
                          <div className="lg:hidden mb-6">
                            <details className="bg-blue-50 rounded-lg border border-blue-200">
                              <summary className="cursor-pointer list-none px-4 py-2 font-medium text-blue-800 flex items-center justify-between">
                                <span>Description</span>
                                <span className="text-xs text-blue-600">tap to toggle</span>
                              </summary>
                              <div className="prose max-w-none text-gray-700 px-4 pb-4">
                                <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                              </div>
                            </details>
                          </div>
                          <div className="prose max-w-none mb-6 text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 hidden lg:block">
                            <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                          </div>
                        </div>
                        
                        {Array.isArray((problem as any).examples) && (problem as any).examples.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-800">Examples:</h3>
                            {(problem as any).examples?.map((example: { input: string; output: string; explanation?: string }, i: number) => (
                              <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-gray-700">Input:</span>
                                    <pre className="mt-1 p-2 bg-white rounded border text-sm overflow-x-auto">
                                      {JSON.stringify(example.input, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Output:</span>
                                    <pre className="mt-1 p-2 bg-white rounded border text-sm overflow-x-auto">
                                      {JSON.stringify(example.output, null, 2)}
                                    </pre>
                                  </div>
                                  {example.explanation && (
                                    <div className="pt-2 border-t border-gray-200">
                                      <span className="font-medium text-gray-700">Explanation:</span>
                                      <p className="mt-1 text-sm text-gray-600">{example.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        
                      </div>
                      
                      {/* Code Editor */}
                      <div className="space-y-4 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <h3 className="font-semibold text-lg text-gray-800 mb-2 sm:mb-0">Your Solution:</h3>
                          <div className="w-full sm:w-auto">
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="javascript">JavaScript</option>
                              <option value="python">Python</option>
                              <option value="java">Java</option>
                              <option value="cpp">C++</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden shadow-md bg-white">
                          <CodeEditor
                            value={currentProblemCode}
                            onChange={handleCodeChange}
                            language={language}
                            height="600px"
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              wordWrap: 'on',
                              readOnly: isSubmitting,
                              scrollBeyondLastLine: false
                            }}
                          />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (currentProblem) {
                                const pid = String(getProblemId(currentProblem));
                                const key = `${pid}::${language}`;
                                const starter = (currentProblem.starterCode as any)?.[language] || '';
                                setUserCode(prev => ({ ...prev, [key]: starter }));
                                setCurrentProblemCode(starter);
                              }
                            }}
                            className="flex-1 border-gray-300 hover:bg-gray-50"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Code
                          </Button>
                          
                          <Button
                            onClick={() => handleRunTests()}
                            variant="secondary"
                            disabled={isRunning || isRunningAll || isSubmitting}
                            className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300 disabled:opacity-60"
                          >
                            {isRunning ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Run Tests
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={handleRunAllTests}
                            disabled={isRunning || isRunningAll || isSubmitting}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                          >
                            {isRunningAll ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running All...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Run All Tests
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={handleSubmitProblem}
                            disabled={isRunning || isRunningAll || isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Submit Solution (auto-advances on success)
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Test Results (moved under editor) */}
                        {testResults && Array.isArray(testResults.results) && testResults.results.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg text-gray-800">Test Results</h3>
                              <span className="text-sm text-gray-600">
                                Passed <b>{testResults.passed}</b> / {testResults.total}
                                {(() => {
                                  const rtText = (testResults as any).runtimeText ?? (testResults as any).runtime;
                                  const memText = (testResults as any).memoryText ?? (testResults as any).memory_text ?? (testResults as any).memoryStr;
                                  const rt = (testResults as any).runtimeMs ?? (testResults as any).timeMs ?? (testResults as any).executionTime;
                                  const mem = (testResults as any).memoryKb ?? (testResults as any).memory_kb ?? (testResults as any).memory;
                                  const safeNum = (v:any) => {
                                    const n = Number(v);
                                    return Number.isFinite(n) ? Math.round(n) : undefined;
                                  };
                                  const rtVal = safeNum(rt);
                                  const memVal = safeNum(mem);
                                  return (
                                    <>
                                      <> • Runtime: {rtText ? rtText : (rtVal != null ? `${rtVal} ms` : 'N/A')}</>
                                      <> • Memory: {memText ? memText : (memVal != null ? `${memVal} KB` : 'N/A')}</>
                                    </>
                                  );
                                })()}
                              </span>
                            </div>
                            <div className="max-h-72 overflow-y-auto divide-y border rounded-md bg-white">
                              {testResults.results.map((r:any, index:number) => {
                                const hidden = Boolean(r.hidden);
                                const expected = r.expected ?? r.expectedOutput;
                                const actual = r.output ?? r.actualOutput;
                                return (
                                  <div key={index} className={`p-3 ${r.passed ? 'bg-green-50/40' : 'bg-red-50/40'}`}>
                                    <div className="flex items-center gap-2">
                                      {r.passed ? <CheckCircle className="text-green-600 h-4 w-4"/> : <XCircle className="text-red-600 h-4 w-4"/>}
                                      <span className="font-medium">Test {index + 1}</span>
                                      {hidden && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">hidden</span>}
                                      <span className="ml-auto text-xs text-gray-500">{r.runtime || ''}</span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                                      {!hidden && (
                                        <div>
                                          <div className="text-gray-500">Input</div>
                                          <pre className="mt-1 p-2 bg-gray-50 rounded border overflow-x-auto">{typeof r.input === 'string' ? r.input : JSON.stringify(r.input)}</pre>
                                        </div>
                                      )}
                                      {!hidden && (
                                        <div>
                                          <div className="text-gray-500">Expected</div>
                                          <pre className="mt-1 p-2 bg-gray-50 rounded border overflow-x-auto">{typeof expected === 'string' ? expected : JSON.stringify(expected)}</pre>
                                        </div>
                                      )}
                                      <div className={`${hidden ? 'sm:col-span-3' : ''}`}>
                                        <div className="text-gray-500">Actual</div>
                                        <pre className="mt-1 p-2 bg-gray-50 rounded border overflow-x-auto">{r.error ? String(r.error) : (typeof actual === 'string' ? actual : JSON.stringify(actual))}</pre>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>

            {/* Right sidebar: Live Leaderboard (sticky) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-white rounded-lg border p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Live Leaderboard</h3>
                    {liveLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  </div>
                  <ol className="space-y-1 text-sm">
                    {leaderboard.length === 0 ? (
                      <li className="text-gray-500">No entries yet</li>
                    ) : (
                      leaderboard.slice(0, 20).map((e, i) => {
                        let active = false;
                        try {
                          const ts = e.time ? new Date(e.time as any).getTime() : 0;
                          active = ts > 0 && Date.now() - ts < ACTIVE_THRESHOLD_MS;
                        } catch {}
                        return (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                              <span className={`mr-2 inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} aria-hidden="true" />
                              <span className="truncate mr-2">{i + 1}. {e.username}</span>
                            </div>
                            <span className="font-semibold">{e.score}</span>
                          </li>
                        );
                      })
                    )}
                  </ol>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
    );
  }

  // Feedback Phase
  if (phase === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {!isWinner && (
            <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-gray-700 text-sm">
              Thank you for playing — best of luck next time!
            </div>
          )}
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
                <CheckCircle className="mr-3 h-8 w-8" />
                Contest Completed!
              </CardTitle>
              <CardDescription className="text-blue-100 text-base sm:text-lg">
                Thank you for participating in {contest.title}
              </CardDescription>
              {isWinner && (
                <div className="mt-3 flex items-center gap-3">
                  <Link to={`/contests/${id}/results`}>
                    <Button
                      variant="secondary"
                      className={
                        myRank === 1
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : myRank === 2
                          ? 'bg-gray-400 hover:bg-gray-500 text-white'
                          : myRank === 3
                          ? 'bg-amber-700 hover:bg-amber-800 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }
                    >
                      View Results
                    </Button>
                  </Link>
                  {typeof myRank === 'number' && (
                    <span className="text-white/90 text-sm">You placed <b>#{myRank}</b></span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">
                    🎉 Congratulations on completing the contest! We'd love to hear your feedback.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback *
                  </label>
                  <textarea
                    id="feedback"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="How was your contest experience? Any suggestions for improvement?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-lg font-semibold"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completed Phase
  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
                <CheckCircle className="mr-3 h-8 w-8" />
                Thank You!
              </CardTitle>
              <CardDescription className="text-blue-100 text-base sm:text-lg">
                Your participation and feedback have been recorded
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="space-y-6">
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Contest Complete!</h3>
                  <p className="text-green-700">
                    Thank you for participating in {contest.title}. Your feedback has been submitted successfully.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/contests')}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    View Other Contests
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default/Fallback rendering for contest info
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-lg border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl sm:text-3xl font-bold">{contest.title}</CardTitle>
            <CardDescription className="text-blue-100 text-base sm:text-lg">
              {contest.description || 'Contest Information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Contest Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-1">Start Time</h3>
                <p className="text-blue-600 text-sm">
                  {new Date(contest.startTime as string).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-1">Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  contest.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                  contest.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contest.status?.charAt(0).toUpperCase()}{contest.status?.slice(1)}
                </span>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-1">Duration</h3>
                <p className="text-blue-600 text-sm">
                  {contest.duration || 'N/A'} minutes
                </p>
              </div>
            </div>
            
            {/* Contest Description */}
            {contest.description && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Description</h3>
                <p className="text-gray-700 leading-relaxed">{contest.description}</p>
              </div>
            )}

            {/* Contest Rules */}
            {contest.rules && contest.rules.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">Rules</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {contest.rules.map((rule, index) => (
                    <li key={index} className="text-gray-700">{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contest Prizes */}
            {contest.prizes && contest.prizes.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-xl font-semibold mb-3 text-yellow-800">Prizes</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {contest.prizes.map((prize, index) => (
                    <li key={index} className="text-gray-700">{prize}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
              {isRegistered ? (
                <Button
                  onClick={() => {
                    if (contestHasStarted && !contestEnded) {
                      setPhase('problems');
                    } else if (contestEnded) {
                      toast('This contest has ended');
                    } else {
                      toast('Contest will start soon');
                    }
                  }}
                  disabled={contestEnded}
                  className={`px-8 py-3 text-lg font-semibold ${
                    contestHasStarted && !contestEnded
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400'
                  }`}
                >
                  {contestEnded ? 'Contest Ended' :
                   contestHasStarted ? 'Enter Contest' : 
                   'Contest Starts Soon'}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login', { state: { from: `/contest/${id}` } })}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-lg font-semibold"
                >
                  Register for Contest
                </Button>
              )}
              
              <Button
                onClick={() => navigate('/contests')}
                variant="outline"
                className="px-8 py-3 text-lg font-semibold border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Back to Contests
              </Button>
            </div>

            {/* Render feedback section if contest is completed */}
            {renderFeedbackSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContestPage;