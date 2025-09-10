import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AxiosResponse } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';
import { Play, RotateCcw, Clock, Loader2, Check, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import CodeEditor from '../components/common/CodeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

interface RunTestResponse {
  data: any; // Replace 'any' with a more specific type if you know the structure
  status: number;
  statusText: string;
  // Add other Axios response properties as needed
}

type ContestPhase = 'guidelines' | 'problems' | 'feedback' | 'completed';

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

  // Handle contest end
  const handleContestEnd = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase('feedback');
    toast.success('Contest has ended! Please submit your feedback.');
  }, []);

  // Start timer function
  const startTimer = useCallback((duration: number) => {
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

  // Handle code changes
  const handleCodeChange = useCallback((value: string) => {
    if (!currentProblem) return;
    setUserCode(prev => ({
      ...prev,
      [currentProblem._id]: value
    }));
  }, [currentProblem]);

  // Handle running tests
  const handleRunTests = useCallback(async (problemId?: string) => {
    const targetProblem = problemId ? problems.find(p => p._id === problemId) : currentProblem;
    if (!targetProblem) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiService.post<RunTestResponse>(`/problems/${targetProblem._id}/run`, {
        code: userCode[targetProblem._id] || '',
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
  }, [currentProblem, problems, language, userCode]);

  // Handle problem submission
  const handleSubmitProblem = useCallback(async () => {
    if (!currentProblem) return;
    
    setIsSubmitting(true);
    try {
      await apiService.post(`/contests/${contestId}/submit`, {
        problemId: currentProblem._id,
        code: userCode[currentProblem._id] || '',
        language
      });
      
      toast.success('Solution submitted successfully');
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentProblem, contestId, userCode, language]);

  // Handle feedback submission
  const handleSubmitFeedback = useCallback(async () => {
    try {
      await apiService.post(`/contests/${contestId}/feedback`, {
        feedback
      });
      
      toast.success('Feedback submitted successfully');
      setPhase('completed');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }, [contestId, feedback]);

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
        const problemPromises = (data.contest.problems as string[]).map((id: string) => 
          apiService.get<Problem>(`/problems/${id}`)
        );
        const problemsData = await Promise.all(problemPromises);
        setProblems(problemsData);
      }

      // Check registration status
      const isRegistered = await checkRegistrationStatus(contestId);
      setIsRegistered(isRegistered);
      
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

  // Initialize data on mount
  useEffect(() => {
    fetchContestData();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchContestData]);

  // Get current problem code
  const currentProblemCode = useMemo(() => {
    if (!currentProblem) return '';
    return userCode[currentProblem._id] || currentProblem.starterCode?.[language] || '';
  }, [currentProblem, userCode, language]);

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
                <div dangerouslySetInnerHTML={{ __html: contest.guidelines }} />
              </div>
              
              {contest.rules && contest.rules.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h2 className="text-xl font-semibold mb-3 text-blue-800">Contest Rules:</h2>
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
                  disabled={!hasAgreedToGuidelines}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-lg font-semibold"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Contest
                </Button>
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
          
          {/* Problems Tabs */}
          <Card className="shadow-lg border-blue-200">
            <Tabs value={currentProblem?._id} onValueChange={(value) => {
              const index = problems.findIndex(p => p._id === value);
              if (index >= 0) setCurrentProblemIndex(index);
            }}>
              <TabsList className="w-full bg-blue-100 p-1 h-auto flex-wrap gap-1">
                {problems.map((problem, index) => (
                  <TabsTrigger 
                    key={problem._id} 
                    value={problem._id}
                    className="flex-1 min-w-[120px] py-2 px-3 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Problem {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {problems.map((problem) => (
                <TabsContent key={problem._id} value={problem._id} className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
                    {/* Problem Description */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{problem.title}</h2>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium self-start ${
                            problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                        </div>
                        
                        <div className="prose max-w-none mb-6 text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                        </div>
                      </div>
                      
                      {problem.examples?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-gray-800">Examples:</h3>
                          {problem.examples.map((example, i) => (
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
                      {testResults.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-gray-800">Test Results:</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {testResults.map((result, i) => (
                              <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                result.passed 
                                  ? 'bg-green-50 border-green-500' 
                                  : 'bg-red-50 border-red-500'
                              }`}>
                                <div className="flex items-center mb-2">
                                  {result.passed ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                  )}
                                  <span className="font-medium">
                                    Test Case {i + 1}: {result.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div>Input: <code className="bg-white px-1 rounded">{JSON.stringify(result.input)}</code></div>
                                  <div>Expected: <code className="bg-white px-1 rounded">{JSON.stringify(result.expected)}</code></div>
                                  <div>Got: <code className="bg-white px-1 rounded">{JSON.stringify(result.output)}</code></div>
                                </div>
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
                                [currentProblem._id]: currentProblem.starterCode?.[language] || ''
                              }));
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
                              Submit Solution
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
        </div>
      </div>
    );
  }

  // Feedback Phase
  if (phase === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
                <CheckCircle className="mr-3 h-8 w-8" />
                Contest Completed!
              </CardTitle>
              <CardDescription className="text-blue-100 text-base sm:text-lg">
                Thank you for participating in {contest.title}
              </CardDescription>
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
                  {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
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
                  onClick={() => navigate('/login', { state: { from: `/contest/${contestId}` } })}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContestPage;