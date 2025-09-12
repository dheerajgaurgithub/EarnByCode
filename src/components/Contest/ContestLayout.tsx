import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ContestProblem } from './ContestProblem';
import ContestGuidelines from './ContestGuidelines';
import { CodeExecutionResult, TestCaseResult } from '../../types/codeExecution';
import { CodeEditor } from '../CodeEditor/CodeEditor';
import { Button } from '../ui/button';
import apiService from '../../services/api';

interface ProblemsResponse {
  problems: Problem[];
}

interface ContestResponse {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  rules?: string[];
}

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  order: number;
  constraints: string[];
  sampleTestCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

interface ContestLayoutProps {
  contestId: string;
  onContestEnd?: () => void;
}

export function ContestLayout({ contestId, onContestEnd }: ContestLayoutProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180 * 60); // 3 hours in seconds
  const [activeTab, setActiveTab] = useState('testcases');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (showGuidelines) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Contest has ended!');
          if (onContestEnd) onContestEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showGuidelines, onContestEnd]);

  // Load initial code template based on language
  useEffect(() => {
    if (currentProblem) {
      const template = getCodeTemplate(language, currentProblem);
      setCode(template);
    }
  }, [currentProblem, language]);

  // Fetch contest data and problems
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setIsLoading(true);
        const [contestRes, problemsRes] = await Promise.all([
          apiService.get<ContestResponse>(`/contests/${contestId}`),
          apiService.get<ProblemsResponse>(`/contests/${contestId}/problems`),
          fetchUserSubmissions()
        ]);

        const problems = problemsRes.problems || [];
        setProblems(problems);
        if (problems.length > 0) {
          setCurrentProblem(problems[0]);
        }
      } catch (error) {
        console.error('Error fetching contest data:', error);
        toast.error('Failed to load contest data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContestData();
  }, [contestId]);

  interface Submission {
    _id: string;
    problemId: string;
    code: string;
    language: string;
    status: string;
    message?: string;
    testCases?: TestCaseResult[];
    runtime?: number;
    createdAt: string;
  }

  const fetchUserSubmissions = async () => {
    try {
      const response = await apiService.get<{ data: Submission[] }>(`/submissions?contestId=${contestId}`);
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleStartContest = () => {
    setShowGuidelines(false);
    // TODO: Start contest timer
  };

  const handleRun = async () => {
    if (!currentProblem || !code.trim()) return;
    
    try {
      setIsSubmitting(true);
      const result = await apiService.post<CodeExecutionResult>('/execute', {
        problemId: currentProblem._id,
        code,
        language,
        isSubmission: false
      });
      
      setExecutionResult(result);
      setActiveTab('results');
      toast.success('Code executed successfully!');
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Failed to execute code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode('');
  };

  // Extend TestCaseResult to include expected and actual properties
  interface ExtendedTestCaseResult extends TestCaseResult {
    expected?: string;
    actual?: string;
    passed?: boolean;
  }

  const handleSubmit = async () => {
    if (!currentProblem || !code.trim()) return;
    
    try {
      setIsSubmitting(true);
      const result = await apiService.post<CodeExecutionResult>('/submissions', {
        problemId: currentProblem._id,
        contestId,
        code,
        language,
        isSubmission: true
      });
      
      // Update submissions list
      await fetchUserSubmissions();
      setExecutionResult(result);
      setActiveTab('submissions');
      
      if (result.status === 'accepted') {
        toast.success('Submission accepted!');
      } else {
        toast.error(`Submission failed: ${result.error || 'Wrong answer'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate code template based on language and problem
  const getCodeTemplate = (lang: string, problem: Problem) => {
    const templates: { [key: string]: string } = {
      'javascript': `function ${problem.title.replace(/\s+/g, '')}(input) {
  // Your code here
  
}

// Example usage:
// const result = ${problem.title.replace(/\s+/g, '')}(sampleInput);
// console.log(result);`,
      'python': `def ${problem.title.toLowerCase().replace(/\s+/g, '_')}(input):
    # Your code here
    pass

# Example usage:
# result = ${problem.title.toLowerCase().replace(/\s+/g, '_')}(sample_input)
# print(result)`,
      'java': `public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
    
    public static Object ${problem.title.replace(/\s+/g, '')}(Object input) {
        // Your code here
        return null;
    }
}`,
      'cpp': `#include <iostream>
#include <vector>

using namespace std;

class Solution {
public:
    // Your code here
};

int main() {
    Solution sol;
    // Example usage
    return 0;
}`
    };
    
    return templates[lang] || '// Start coding here...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Loading contest...</span>
      </div>
    );
  }

  if (showGuidelines) {
    return (
      <ContestGuidelines
        contest={{
          title: 'Coding Contest',
          duration: 180, // 3 hours
          rules: [
            'You will have 3 hours to complete the contest',
            'You can submit your solution multiple times',
            'Plagiarism will result in disqualification',
            'Internet access is allowed for documentation only',
            'Do not share solutions with others during the contest'
          ]
        }}
        onAgree={handleStartContest}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar - Problems list */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Problems</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-2 space-y-1">
            {problems.map((problem) => (
              <Button
                key={problem._id}
                variant={currentProblem?._id === problem._id ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${
                  currentProblem?._id === problem._id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setCurrentProblem(problem)}
              >
                <span className="mr-2 font-mono text-sm">{problem.order}.</span>
                <span className="truncate">{problem.title}</span>
                <span className="ml-auto text-xs text-gray-500">{problem.points} pts</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* Problem statement */}
          <div className="w-1/2 h-full overflow-y-auto">
            {currentProblem && <ContestProblem problem={currentProblem} />}
          </div>

          {/* Code editor */}
          <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-2 border-b border-gray-200 flex justify-between items-center">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex-1">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    code={code}
                    language={language}
                    onChange={setCode}
                    onRun={handleRun}
                    onReset={handleReset}
                    className="h-full"
                  />
                </div>
                <div className="p-4 border-t flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRun}
                    disabled={isSubmitting}
                  >
                    Run Code
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom panel for test cases and results */}
        <div className="h-64 border-t border-gray-200 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 ${activeTab === 'testcases' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('testcases')}
              >
                Test Cases
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'results' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('results')}
              >
                Results
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'submissions' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('submissions')}
              >
                Submissions
              </button>
            </div>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {activeTab === 'testcases' && (
              <div className="space-y-4">
                <h3 className="font-medium">Sample Test Cases</h3>
                {currentProblem?.sampleTestCases?.map((testCase, index) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Input</div>
                        <pre className="bg-white p-2 rounded text-sm overflow-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Expected Output</div>
                        <pre className="bg-white p-2 rounded text-sm overflow-auto">
                          {testCase.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-4">
                <h3 className="font-medium">Execution Results</h3>
                {executionResult ? (
                  <div className="space-y-4">
                    <div className={`p-3 rounded-md ${
                      executionResult.status === 'accepted' 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      <div className="font-medium">
                        {executionResult.status === 'accepted' ? '✓ Accepted' : '✗ Failed'}
                      </div>
                      {executionResult.message && (
                        <div className="mt-1 text-sm">{executionResult.message}</div>
                      )}
                    </div>
                    
                    {executionResult.testCases && executionResult.testCases.length > 0 && (
                      <div className="space-y-4">
                        {(executionResult.testCases as ExtendedTestCaseResult[]).map((testCase, idx) => (
                          <div key={idx} className="border rounded-md overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b">
                              Test Case {idx + 1}
                              {testCase.passed ? (
                                <span className="ml-2 text-green-600 text-sm">✓ Passed</span>
                              ) : (
                                <span className="ml-2 text-red-600 text-sm">✗ Failed</span>
                              )}
                            </div>
                            <div className="p-4 space-y-2">
                              <div>
                                <div className="text-sm text-gray-500">Input:</div>
                                <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                                  {testCase.input}
                                </pre>
                              </div>
                              {testCase.expected && (
                                <div>
                                  <div className="text-sm text-gray-500">Expected Output:</div>
                                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                                    {testCase.expected}
                                  </pre>
                                </div>
                              )}
                              {!testCase.passed && testCase.actual && (
                                <div>
                                  <div className="text-sm text-gray-500">Your Output:</div>
                                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto text-red-600">
                                    {testCase.actual}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Run your code to see results
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Your Submissions</h3>
                  <button 
                    onClick={fetchUserSubmissions}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>
                
                {submissions.length > 0 ? (
                  <div className="overflow-hidden border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runtime</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => (
                          <tr 
                            key={submission._id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setCode(submission.code);
                              setLanguage(submission.language);
                              setExecutionResult({
                                status: submission.status,
                                message: submission.message,
                                testCases: submission.testCases
                              });
                              setActiveTab('results');
                            }}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(submission.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {problems.find(p => p._id === submission.problemId)?.title || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {submission.language}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                submission.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {submission.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {submission.runtime || 'N/A'} ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No submissions yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContestLayout;
