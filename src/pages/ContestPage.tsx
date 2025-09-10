import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';
import { Play, RotateCcw, Clock, Loader2, Check, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
// Import CodeEditor as default import
import CodeEditor from '../components/common/CodeEditor';

// Import Tabs components from the correct path
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Helper function to safely access problem data
const getProblemData = (problem: Problem) => ({
  _id: problem._id,
  title: problem.title,
  description: problem.description,
  difficulty: problem.difficulty,
  testCases: problem.testCases || [],
  examples: problem.examples || [],
  starterCode: problem.starterCode || { javascript: '// Your code here' },
  constraints: problem.constraints || []
});
import { toast } from 'react-hot-toast';

// Define types for contest and problem
interface Problem {
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

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string | Date;
  endTime: string | Date;
  duration: number; // in minutes
  isPublished: boolean;
  participants: Array<{
    user: string | { _id: string; name: string; email: string };
    joinedAt: string | Date;
    submission?: any;
  }>;
  problems: string[] | Problem[];
  guidelines: string;
  rules: string[];
  prizes: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  status: 'upcoming' | 'ongoing' | 'completed';
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
}

interface ContestResponse {
  contest: Contest;
  problems?: Problem[];
}

type ContestPhase = 'guidelines' | 'problems' | 'feedback' | 'completed';

const ContestPage = () => {
  const { contestId = '' } = useParams<{ contestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [phase, setPhase] = useState<ContestPhase>('guidelines');
  const [hasAgreedToGuidelines, setHasAgreedToGuidelines] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    input: any;
    expected: any;
    output: any;
    passed: boolean;
  }>>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [isRegistered, setIsRegistered] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized values
  const currentProblem = useMemo(() => {
    return problems[currentProblemIndex];
  }, [problems, currentProblemIndex]);

  const currentCode = useMemo(() => {
    if (!currentProblem) return '';
    return userCode[currentProblem._id] || currentProblem.starterCode?.[language] || '';
  }, [currentProblem, userCode, language]);

  const contestHasStarted = useMemo(() => {
    if (!contest) return false;
    const now = new Date();
    const startTime = new Date(contest.startTime);
    return now >= startTime;
  }, [contest]);

  const contestEnded = useMemo(() => {
    if (!contest) return false;
    return new Date() >= new Date(contest.endTime);
  }, [contest]);

  // Format time for display
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback((value: string) => {
    if (!currentProblem) return;
    setUserCode(prev => ({
      ...prev,
      [currentProblem._id]: value
    }));
  }, [currentProblem]);

  // Get current code for the active problem
  const currentProblemCode = useMemo(() => {
    if (!currentProblem) return '';
    return userCode[currentProblem._id] || currentProblem.starterCode?.[language] || '';
  }, [currentProblem, userCode, language]);

  // Handle contest end
  const handleContestEnd = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase('feedback');
    toast.success('Contest has ended! Please submit your feedback.');
  }, []);

  // Timer function type to avoid circular dependency
  type TimerFunction = (duration: number) => () => void;

  // Declare startTimer with proper type
  const startTimer: TimerFunction = useCallback((duration: number) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set initial time
    setTimeLeft(duration);

    // Store the end time in a ref to avoid dependency on handleContestEnd
    const endTime = Date.now() + duration;

    // Start new timer
    timerRef.current = setInterval(() => {
      const timeRemaining = endTime - Date.now();
      
      if (timeRemaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleContestEnd();
        // Refresh contest data after contest ends
        if (contestId) {
          apiService.get<Contest>(`/contests/${contestId}`).then(setContest);
        }
        setTimeLeft(0);
      } else {
        setTimeLeft(timeRemaining);
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [contestId, handleContestEnd]);

  // Check registration status
  const checkRegistrationStatus = useCallback(async (cid: string) => {
    if (!user) return false;

    try {
      const contest = await apiService.get<Contest>(`/contests/${cid}`);

      // Check if current user is in participants
      return contest.participants?.some(participant => {
        const participantId = typeof participant.user === 'string'
          ? participant.user
          : participant.user?._id;
        return participantId === user._id;
      }) || false;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  }, [user]);

  // Fetch contest problems
  const fetchContestProblems = useCallback(async (problemIds: string[] | Problem[]) => {
    if (!problemIds || problemIds.length === 0) return [];

    try {
      // Check if the first item is a string (ID) or an object (full problem)
      if (typeof problemIds[0] === 'string') {
        const response = await apiService.get<{ data: Problem[] }>(`/problems?ids=${problemIds.join(',')}`);
        return response.data.map(problem => getProblemData(problem));
      } else {
        // If we already have the full problem objects, just return them
        return (problemIds as Problem[]).map(problem => getProblemData(problem));
      }
    } catch (error) {
      console.error('Error fetching contest problems:', error);
      toast.error('Failed to load contest problems');
      return [];
    }
  }, []);

  // Handle running tests
  const handleRunTests = useCallback(async () => {
    if (!currentProblem) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiService.post(`/problems/${currentProblem._id}/run`, {
        code: userCode[currentProblem._id] || '',
        language
      });
      
      setTestResults(response.data);
      toast.success('Tests executed successfully');
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Failed to run tests');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentProblem, language, userCode]);

  // Fetch contest data
  const fetchContestData = useCallback(async () => {
    if (!contestId) return;

    try {
      setIsLoading(true);
      const data = await apiService.get<ContestResponse>(`/contests/${contestId}`);
      setContest(data.contest);
      
      if (data.problems) {
        setProblems(data.problems);
      } else if (Array.isArray(data.contest.problems) && data.contest.problems.length > 0) {
        // If problems are just IDs, fetch them
        const problemPromises = data.contest.problems.map((id: string) => 
          apiService.get<Problem>(`/problems/${id}`)
        );
        const problemsData = await Promise.all(problemPromises);
        setProblems(problemsData);
      }

      // Check registration status
      const isRegistered = await checkRegistrationStatus(contestId);
      if (!isRegistered) {
        toast.error('You are not registered for this contest');
        navigate('/contests');
        return;
      }

      // Set initial phase based on contest timing
      const now = new Date();
      const startTime = new Date(data.contest.startTime);
      const endTime = new Date(data.contest.endTime);

      if (now < startTime) {
        setPhase('guidelines');
      } else if (now >= startTime && now < endTime) {
        setPhase('problems');
        // Start timer if contest is ongoing
        startTimer(endTime.getTime() - now.getTime());
      } else {
        setPhase('completed');
      }
    } catch (error) {
      console.error('Error fetching contest data:', error);
      toast.error('Failed to load contest data');
    } finally {
      setIsLoading(false);
    }
  }, [contestId, navigate, startTimer, checkRegistrationStatus]);

  // Handle contest start
  const handleStartContest = useCallback(() => {
    if (!hasAgreedToGuidelines) {
      toast.error('Please agree to the contest guidelines before starting');
      return;
    }

    setPhase('problems');

    // Start the contest timer if not already started
    if (contest?.duration && !timerRef.current) {
      const durationMs = contest.duration * 60 * 1000; // Convert minutes to ms
      startTimer(durationMs);
    }
  }, [contest, hasAgreedToGuidelines, startTimer]);
  
  // Handle problem navigation
  const handleNextProblem = useCallback(() => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    }
  }, [currentProblemIndex, problems.length]);

  const handlePrevProblem = useCallback(() => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(prev => prev - 1);
    }
  }, [currentProblemIndex]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleContestEnd();
      // Refresh contest data after contest ends
      if (contestId) {
        apiService.get<Contest>(`/contests/${contestId}`).then(setContest);
      }
      setTimeLeft(0);
    } else {
      setTimeLeft(timeRemaining);
    }
  }, [contestId, handleContestEnd, timeRemaining]);

// Check registration status
const checkRegistrationStatus = useCallback(async (cid: string) => {
  if (!user) return false;

  
  try {
    const contest = await apiService.get<Contest>(`/contests/${cid}`);
    
    // Check if current user is in participants
    return contest.participants?.some(participant => {
      const participantId = typeof participant.user === 'string' 
        ? participant.user 
        : participant.user?._id;
      return participantId === user._id;
    }) || false;
  } catch (error) {
    console.error('Error checking registration status:', error);
    return false;
        [problems[0]._id]: problems[0].starterCode?.['javascript'] || ''

  // Get current problem
  const currentProblem = problems[currentProblemIndex] || null;

  // Format time left
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (isLoading || !contest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Format time left for display
  const formatTimeLeft = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render loading state if contest data is not available
  if (!contest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Contest Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{contest.title}</h1>
          {phase === 'problems' && (
            <p className="text-gray-600">
              Problem {currentProblemIndex + 1} of {problems.length}
            </p>
          )}
        </div>
        {phase === 'problems' && (
          <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-md">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            <span className="font-mono font-medium">{formatTimeLeft(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Guidelines Phase */}
      {phase === 'guidelines' && (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{contest.title} - Guidelines</h1>
          <div className="prose max-w-none mb-6">
            <div dangerouslySetInnerHTML={{ __html: contest.guidelines }} />
          </div>
          
          {contest.rules && contest.rules.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Rules:</h2>
              <ul className="list-disc pl-6 space-y-1">
                {contest.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agree-guidelines"
              checked={hasAgreedToGuidelines}
              onChange={(e) => setHasAgreedToGuidelines(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="agree-guidelines" className="ml-2 text-sm text-gray-700">
              I agree to the contest guidelines and rules
            </label>
          </div>
          
          <Button
            onClick={handleStartContest}
            disabled={!hasAgreedToGuidelines}
            className="w-full sm:w-auto"
          >
            Start Contest
        </Button>
      </div>
    );
  }

  if (phase === 'problems' && contest) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{contest.title} - Problems</h1>
          <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-md">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            <span className="font-mono font-medium">{formatTimeLeft(timeLeft)}</span>
          </div>
        </div>
        
        <Tabs value={currentProblem?._id} onValueChange={(value) => {
          const index = problems.findIndex(p => p._id === value);
          if (index >= 0) setCurrentProblemIndex(index);
        }}>
          <TabsList className="mb-4">
            {problems.map((problem, index) => (
              <TabsTrigger key={problem._id} value={problem._id}>
                Problem {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {problems.map((problem) => (
            <TabsContent key={problem._id} value={problem._id}>
              <div className="p-4 border rounded-lg">
                <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
                <div className="prose max-w-none mb-6">
                  <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                </div>
                
                {problem.examples?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Examples:</h3>
                    {problem.examples.map((example, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-md mb-4">
                        <p><strong>Input:</strong> {JSON.stringify(example.input)}</p>
                        <p><strong>Output:</strong> {JSON.stringify(example.expected)}</p>
                        {example.explanation && (
                          <p className="mt-2 text-sm text-gray-600">
                            <strong>Explanation:</strong> {example.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Your Solution:</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden h-[500px]">
                    <CodeEditor
                      value={currentProblemCode}
                      onChange={handleCodeChange}
                      language={language}
                      height="500px"
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        readOnly: isSubmitting
                      }}
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentProblem) {
                          setUserCode(prev => ({
                            ...prev,
                            [currentProblem._id]: currentProblem.starterCode?.[language] || ''
                          }));
                        }
                      }}
                    >
                      Reset Code
                    </Button>
                    <Button
                      onClick={() => {
                        // Handle test run
                        if (currentProblem) {
                          handleRunTests(currentProblem._id);
                        }
                      }}
                      variant="secondary"
                    >
                      Run Tests
                    </Button>
                    <Button
                      onClick={handleSubmitProblem}
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Solution'
                      )}
                    </Button>
                  </div>
                </div>
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (phase === 'feedback') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Contest Completed!</CardTitle>
            <CardDescription>Thank you for participating in {contest?.title}!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>We'd love to hear your feedback about the contest.</p>
              
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What did you think of the contest?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitFeedback}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{contest.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Start Time</h3>
          <p>{new Date(contest.startTime as string).toLocaleString()}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Status</h3>
          <span className={`px-2 py-1 rounded text-sm ${
            contest.status === 'ongoing' ? 'bg-green-100 text-green-800' :
            contest.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {contest.status}
          </span>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Duration</h3>
          <p>{contest.duration || 'N/A'} minutes</p>
        </div>
      </div>
      
      <div className="prose max-w-none mb-6">
        <h3>Description</h3>
        <p>{contest.description || 'No description available'}</p>
      </div>

      {(contest.rules && contest.rules.length > 0) ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Rules</h3>
          <ul className="list-disc pl-5">
            {contest.rules.map((rule, index) => (
              <li key={index} className="mb-1">{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        {isRegistered ? (
          <button
            onClick={() => navigate(`/contests/${contestId}/problems`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!contestHasStarted}
          >
            {contestHasStarted ? 'Enter Contest' : 'Contest starts soon'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login', { state: { from: `/contest/${contestId}` } })}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Register for Contest
          </button>
        )}
      </div>
    </div>
  );
};

export default ContestPage;
