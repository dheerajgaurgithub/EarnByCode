import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';
import { Contest } from '../types/contest';
import { TestCaseResult } from '@/types/codeExecution';
import { RunTestResponse } from '@/types/contest';
import { Problem } from '../types';
import ContestFeedback from '@/components/Contest/ContestFeedback';
import { toast } from 'react-toastify';
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [language, setLanguage] = useState<string>('javascript');
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch contest data with problems populated
        const contestData = await apiService.get<ContestWithProblems>(`/contests/${id}?populate=problems`);
        
        // Update contest with problems
        setContest(contestData);
        const contestProblems = contestData.problems || [];
        setProblems(contestProblems);
        
        if (contestProblems.length > 0) {
          setCurrentProblem(contestProblems[0]);
        }
        
        // Calculate time left
        const now = new Date();
        const startTime = new Date(contestData.startTime);
        const endTime = new Date(contestData.endTime);
        
        if (now >= endTime) {
          setContestEnded(true);
          setPhase('completed');
          setTimeLeft(0);
        } else if (now >= startTime) {
          setContestHasStarted(true);
          const timeLeftInSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
          setTimeLeft(timeLeftInSeconds);
        } else {
          const timeLeftInSeconds = Math.floor((startTime.getTime() - now.getTime()) / 1000);
          setTimeLeft(timeLeftInSeconds);
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
    
    const updateTimer = () => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setContestEnded(true);
          setPhase('completed');
          return 0;
        }
        return prev - 1;
      });
    };
    
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [contest]);
  
  // Handle contest phase changes
  const handleStartContest = useCallback(() => {
    if (!hasAgreedToGuidelines) {
      toast.error('Please agree to the guidelines first');
      return;
    }
    
    if (contest && (contest.problems?.length ?? 0) > 0) {
      setPhase('problems');
      setCurrentProblemIndex(0);
    } else {
      toast.error('No problems available in this contest');
    }
  }, [hasAgreedToGuidelines, contest]);

  const handleProblemSelect = useCallback((index: number) => {
    const total = contest?.problems?.length ?? 0;
    if (contest && index >= 0 && index < total) {
      setCurrentProblemIndex(index);
      setCurrentProblem(contest.problems![index]);
    }
  }, [contest]);

  const handleCodeChange = useCallback((value: string) => {
    if (!contest) return;

    const currentProblemData = contest.problems?.[currentProblemIndex];
    if (currentProblemData) {
      setUserCode((prev) => ({
        ...prev,
        [currentProblemData.id]: value,
      }));
    }
    setCurrentProblemCode(value);
  }, [contest, currentProblemIndex]);

  const handleRunTests = useCallback(async (problemId?: string) => {
    const targetProblem = problemId ? problems.find(p => p.id.toString() === problemId) : currentProblem;
    if (!targetProblem) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiService.post<RunTestResponse>(`/problems/${targetProblem.id}/run`, {
        code: userCode[targetProblem.id.toString()] || '',
        language
      });
      
      setTestResults({
        results: response.results || [],
        passed: response.passed || 0,
        total: response.total || 0,
        executionTime: response.executionTime || 0,
        error: response.error
      });
      
      // Refresh contest data
      if (id) {
        const contestData = await apiService.get<ContestWithProblems>(`/contests/${id}?populate=problems`);
        setContest(contestData);
      }
      
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Failed to run tests');
    } finally {
      setIsSubmitting(false);
    }
  }, [problems, currentProblem, userCode, language, id]);

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

      const response = await apiService.post<SubmitResponse>(`/problems/${currentProblem.id}/submit`, {
        code: userCode[currentProblem.id.toString()] || '',
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
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentProblem, userCode, language, id, currentProblemIndex, problems]);

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

  // Update current problem when index changes
  useEffect(() => {
    if (problems.length > 0 && currentProblemIndex >= 0 && currentProblemIndex < problems.length) {
      const problem = problems[currentProblemIndex];
      setCurrentProblem(problem);
setCurrentProblemCode(userCode[problem.id.toString()] || '');
    }
  }, [currentProblemIndex, problems, userCode]);

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
            <Tabs value={currentProblem?.id.toString()} onValueChange={(value) => {
              const index = problems.findIndex(p => p.id.toString() === value);
              if (index >= 0) {
                setCurrentProblemIndex(index);
                setCurrentProblem(problems[index]);
              }
            }}>
              <TabsList className="w-full bg-blue-100 p-1 h-auto flex-wrap gap-1">
                {problems.map((problem, index) => (
                  <TabsTrigger 
                    key={problem.id.toString()} 
                    value={problem.id.toString()}
                    className="flex-1 min-w-[120px] py-2 px-3 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Problem {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {problems.map((problem) => (
                <TabsContent key={problem.id.toString()} value={problem.id.toString()} className="p-0">
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
                      
                      {problem.examples && problem.examples.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-gray-800">Examples:</h3>
                          {problem.examples?.map((example: { input: string; output: string; explanation?: string }, i: number) => (
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
                                [currentProblem.id.toString()]: (currentProblem.starterCode as any)?.[language] || ''
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