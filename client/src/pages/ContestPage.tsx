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
        
        if (now >= endTime) {
          // Contest has ended; mark ended but do not auto-navigate to completed page.
          // Let the user see guidelines and a disabled Start button.
          setContestEnded(true);
          setTimeLeft(0);
          setTimeMode('untilEnd');
        } else if (now >= startTime) {
          setContestHasStarted(true);
          const timeLeftInSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
          setTimeLeft(timeLeftInSeconds);
          setTimeMode('untilEnd');
        } else {
          const timeLeftInSeconds = Math.floor((startTime.getTime() - now.getTime()) / 1000);
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

  // Handle timer
  useEffect(() => {
    if (!contest) return;

    const tick = () => {
      setTimeLeft(prev => {
        // No negative time
        if (prev <= 0) {
          if (timeMode === 'untilStart') {
            // Switch to contest running window
            try {
              const now = new Date();
              const endTime = new Date((contest as any).endTime);
              const secs = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
              setContestHasStarted(true);
              setTimeMode('untilEnd');
              return secs;
            } catch {
              setTimeMode('untilEnd');
              return 0;
            }
          } else {
            // Contest is over: only switch to completed if the user actually started this session
            setContestEnded(true);
            if (userStarted) {
              setPhase('completed');
            }
            return 0;
          }
        }
        return prev - 1;
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contest, timeMode, userStarted]);

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
    if (contestEnded) {
      toast.error('This contest has ended. You cannot start it now.');
      return;
    }
    
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
        setUserCode((prev) => ({ ...prev, [pid]: starter }));
        setCurrentProblemCode(starter);
      } catch {}
      toast.success('Contest started!');
      setUserStarted(true);
      setPhase('problems');
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
      setCurrentProblem(problems[index]);
    }
  }, [problems]);

  const handleCodeChange = useCallback((value: string) => {
    const currentProblemData = problems?.[currentProblemIndex];
    if (currentProblemData) {
      setUserCode((prev) => ({
        ...prev,
        [String(getProblemId(currentProblemData))]: value,
      }));
    }
    setCurrentProblemCode(value);
  }, [problems, currentProblemIndex, getProblemId]);

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
            setCurrentProblemCode(starter);
            setUserCode((prev) => ({ ...prev, [String(getProblemId(prob))]: starter }));
          }
        } catch (e) {
          // ignore; will still render basic info
        }
      }
    };
    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProblemIndex, problems]);

  const handleRunTests = useCallback(async (problemId?: string) => {
    const targetProblem = problemId ? problems.find(p => String(getProblemId(p)) === problemId) : currentProblem;
    if (!targetProblem) return;
    setIsSubmitting(true);
    try {
      const pid = String(getProblemId(targetProblem));
      const t0 = performance.now();
      const resp = await fetch('/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode[pid] || '', lang: language.charAt(0).toUpperCase() + language.slice(1) }),
      });
      const data = await resp.json();
      const t1 = performance.now();
      const out = data?.output ?? data?.run?.output ?? '';
      const execMs = Math.max(0, Math.round(t1 - t0));
      setTestResults({
        results: [{ passed: true, output: out } as any],
        passed: 0,
        total: 0,
        executionTime: execMs,
      } as any);
      toast.success(`Ran in ${execMs} ms`);
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Run failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [problems, currentProblem, userCode, language, getProblemId]);

  const handleSubmitProblem = useCallback(async () => {
    if (!currentProblem) {
      toast.error('No problem selected');
      return;
    }

    setIsSubmitting(true);
    try {
      interface SubmitResponse {
        success: boolean;
        message?: string;
        // Add other expected response fields here
      }

      const currId = String(getProblemId(currentProblem));
      const response = await apiService.post<SubmitResponse>(`/problems/${currId}/submit`, {
        code: userCode[currId] || '',
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
  }, [currentProblem, userCode, language, id, currentProblemIndex, problems, getProblemId]);

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
      setCurrentProblemCode(userCode[pid] || '');
    }
  }, [currentProblemIndex, problems, userCode, getProblemId]);

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
        <div className="container mx-auto px-4 py-4">
          {/* Contest Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white rounded-lg shadow-md p-4 border border-blue-200">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{contest.title}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Problem {currentProblemIndex + 1} of {problems.length}
              </p>
            </div>
            <div className="flex items-center bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-lg border border-yellow-300 shadow-sm">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              <span className="font-mono font-bold text-orange-800 text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          {/* Main three-column layout: Left sidebar (problems), Center (tabs/content), Right sidebar (live) */}
          <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_300px] gap-4 items-start">
            {/* Left Sidebar: Problems list */}
            <aside className="hidden xl:block bg-white rounded-lg border p-3 h-max sticky top-4">
              <h3 className="font-semibold mb-2">Problems</h3>
              <ol className="space-y-1">
                {problems.map((p, idx) => {
                  const pid = String(getProblemId(p));
                  const active = idx === currentProblemIndex;
                  return (
                    <li key={pid}>
                      <button
                        onClick={() => { setCurrentProblemIndex(idx); setCurrentProblem(problems[idx]); }}
                        className={`w-full text-left px-2 py-1 rounded ${active ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                      >
                        Problem {idx + 1}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>

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
                      className="flex-1 min-w-[120px] py-2 px-3 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Problem {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {problems.map((problem) => (
                  <TabsContent key={String(getProblemId(problem))} value={String(getProblemId(problem))} className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
                      {/* Problem Description */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{problem.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium self-start ${getDifficultyColor(problem.difficulty)}`}>
                              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                            </span>
                          </div>
                          
                          <div className="prose max-w-none mb-6 text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
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

                        {/* Test Results */}
                        {testResults && testResults.results && testResults.results.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-800">Test Results:</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {testResults.results.map((result, index) => (
                                <div key={index} className={`p-3 rounded-md ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                                  <div className="flex items-center">
                                    {result.passed ? (
                                      <CheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="text-red-500 mr-2 flex-shrink-0" />
                                    )}
                                    <span className="font-medium">Test Case {index + 1} - {result.passed ? 'Passed' : 'Failed'}</span>
                                  </div>
                                  {!result.passed && (
                                    <div className="mt-2 text-sm space-y-1 pl-6">
                                      {result.input && (
                                        <div>
                                          Input: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                            {JSON.stringify(result.input)}
                                          </code>
                                        </div>
                                      )}
                                      <div>
                                        Expected: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                          {JSON.stringify(result.expected)}
                                        </code>
                                      </div>
                                      <div>
                                        Got: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                          {result.error ? result.error : JSON.stringify(result.output)}
                                        </code>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Code Editor */}
                      <div className="space-y-4">
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
                            height="400px"
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
                                setUserCode(prev => ({
                                  ...prev,
                                  [String(getProblemId(currentProblem))]: (currentProblem.starterCode as any)?.[language] || ''
                                }));
                                setCurrentProblemCode((currentProblem.starterCode as any)?.[language] || '');
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
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
                          >
                            {isSubmitting ? (
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
                            onClick={handleSubmitProblem}
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>

            {/* Right Sidebar: Live Leaderboard & Clarifications */}
            <aside className="hidden xl:block space-y-4 sticky top-4">
              {/* Ask a Question */}
              <div className="bg-white rounded-lg border p-3">
                <h3 className="font-semibold mb-2">Ask a Question</h3>
                <textarea
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  className="w-full border rounded p-2 text-sm mb-2"
                  rows={3}
                  placeholder="Type your question…"
                />
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm">Visibility:</label>
                  <select
                    value={askVisibility}
                    onChange={(e) => setAskVisibility(e.target.value as any)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All participants</option>
                    <option value="team">Only my team</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="ask-private"
                    type="checkbox"
                    checked={askPrivate}
                    onChange={(e) => setAskPrivate(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="ask-private" className="text-sm">Mark as private</label>
                </div>
                <input
                  type="text"
                  value={askTags}
                  onChange={(e) => setAskTags(e.target.value)}
                  className="w-full border rounded p-2 text-sm mb-2"
                  placeholder="Tags (comma separated)"
                />
                <Button disabled={askSubmitting} onClick={submitClarification} className="w-full">
                  {askSubmitting ? 'Sending…' : 'Send'}
                </Button>
              </div>

              <div className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Live Leaderboard</h3>
                  {liveLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                </div>
                <ol className="space-y-1 text-sm">
                  {leaderboard.length === 0 ? (
                    <li className="text-gray-500">No entries yet</li>
                  ) : (
                    leaderboard.slice(0, 10).map((e, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="truncate mr-2">{i + 1}. {e.username}</span>
                        <span className="font-semibold">{e.score}</span>
                      </li>
                    ))
                  )}
                </ol>
              </div>

              <div className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Clarifications</h3>
                </div>
                <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {clarifications.length === 0 ? (
                    <li className="text-gray-500">No clarifications yet</li>
                  ) : (
                    clarifications.map((c) => (
                      <li key={c.id} className="border rounded p-2">
                        <div className="font-medium">Q: {c.question}</div>
                        {c.answer && <div className="text-green-700 mt-1">A: {c.answer}</div>}
                        {c.at && <div className="text-xs text-gray-400 mt-1">{new Date(c.at).toLocaleString()}</div>}
                      </li>
                    ))
                  )}
                </ul>
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