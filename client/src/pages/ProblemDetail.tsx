import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@monaco-editor/react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Trophy, Award, BookOpen, MessageCircle, Play, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

// Build normalized API bases
const getApiBase = () => {
  const raw = (import.meta.env.VITE_API_URL as string) || 'https://algobucks.onrender.com/api';
  // 'http://localhost:5000';
  let base = raw.replace(/\/+$/, '');
  if (!/\/api$/.test(base)) base = `${base}/api`;
  return base;
};

// Try to infer language from source to warn on mismatch
const detectCodeLanguage = (src: string): Language | null => {
  const s = src.trim();
  if (/#include\s*<.+>/m.test(s) || /\busing\s+namespace\s+std\b/.test(s) || /\bint\s+main\s*\(/.test(s)) return 'cpp';
  if (/\bclass\s+\w+\b/.test(s) && /\bpublic\s+static\s+void\s+main\s*\(/.test(s)) return 'java';
  if (/\bdef\s+\w+\s*\(/.test(s) || /\bprint\s*\(/.test(s)) return 'python';
  if (/\bfunction\b/.test(s) || /=>/.test(s) || /console\.log\(/.test(s)) return 'javascript';
  return null;
};

const validateJavaSolution = (src: string) => /\bclass\s+Solution\b/.test(src);

// Build a safe execute URL without duplicating /api.
// Supports absolute VITE_EXECUTE_PATH (e.g., https://emkc.org/api/v2/piston/execute)
const getExecuteUrl = () => {
  const execPath = (import.meta.env.VITE_EXECUTE_PATH as string) || '';
  // 1) If absolute override provided, use it
  if (/^https?:\/\//i.test(execPath)) return execPath;

  // 2) If running locally in browser, prefer local backend to avoid CORS
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    const local = (import.meta.env.VITE_LOCAL_API_URL as string) || 'http://localhost:5000';
    const base = local.replace(/\/+$/, '').replace(/\/?api$/, '');
    const normalized = (execPath || '/api/execute').startsWith('/') ? (execPath || '/api/execute') : `/${execPath || 'api/execute'}`;
    return `${base}${normalized}`;
  }

  // 3) Default: use configured API base (production)
  const raw = (import.meta.env.VITE_API_URL as string) || 'https://algobucks.onrender.com/api';
  let base = raw.replace(/\/+$/, '');
  base = base.replace(/\/?api$/, '');
  const path = execPath || '/api/execute';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
};

type Language = 'javascript' | 'python' | 'java' | 'cpp';
type TestStatus = 'idle' | 'loading' | 'success' | 'error' | 'running' | 'accepted' | 'submitted';

interface TestCaseResult {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  passed: boolean;
  error?: string;
  runtime?: number;
}

// Raw testcase shape from problems/testCases (input + expected only)
type RawTestCase = { input: unknown; expectedOutput: unknown };

interface BaseCodeResponse {
  status: TestStatus;
  message?: string;
  error?: string;
  testCases?: RawTestCase[];
  results?: TestCaseResult[];
  testsPassed?: number;
  totalTests?: number;
  runtimeMs?: number;
  memoryKb?: number;
  isSubmission?: boolean;
  earnedCodecoin?: boolean;
}

// Removed unused response type aliases

interface TestResults extends Omit<BaseCodeResponse, 'status'> {
  status: TestStatus;
  testCases: RawTestCase[];
  results: TestCaseResult[];
  testsPassed: number;
  totalTests: number;
  isSubmission: boolean;
}

interface Problem {
  _id: string;
  id?: string;
  title: string;
  description: string;
  difficulty: string;
  acceptance?: number;
  submissions?: number;
  starterCode?: Record<string, string>;
  testCases: Array<{
    input: unknown;
    expectedOutput: unknown;
  }>;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
}

// Removed unused ProblemResponse type

// Helper function to get default code for a language (IO-ready patterns)
const getDefaultCode = (language: Language): string => {
  const templates: Record<Language, string> = {
    javascript: `// Read stdin line-by-line with readLine() and print one result per line
function solveOne(line) {
  // TODO: implement per-line solution
  return line;
}

(function main(){
  const out = [];
  for(;;){
    const line = readLine();
    if (line === '') break; // end of input in this sandbox
    out.push(solveOne(line));
  }
  console.log(out.join('\n'));
})();`,
    python: `# Read stdin lines and print one result per line
import sys

def solve_one(s: str) -> str:
    # TODO: implement per-line solution
    return s

def main():
    lines = sys.stdin.read().splitlines()
    out = [solve_one(line) for line in lines]
    sys.stdout.write("\n".join(out))

if __name__ == '__main__':
    main()`,
    java: `import java.io.*;
import java.util.*;

public class Solution {
    static String solveOne(String s) {
        // TODO: implement per-line solution
        return s;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line;
        boolean first = true;
        StringBuilder out = new StringBuilder();
        while ((line = br.readLine()) != null) {
            if (!first) out.append('\n');
            first = false;
            out.append(solveOne(line));
        }
        System.out.print(out.toString());
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

string solveOne(const string& s){
    // TODO: implement per-line solution
    return s;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string line; bool first = true;
    while (getline(cin, line)){
        if (!first) cout << '\n';
        first = false;
        cout << solveOne(line);
    }
    return 0;
}`
  };
  return templates[language] || '';
};

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const editorTheme = useMemo(() => {
    const t = (user as any)?.preferences?.editor?.theme;
    return t === 'vs-dark' ? 'vs-dark' : 'light';
  }, [user]);
  const editorFontSize = useMemo(() => {
    const n = Number((user as any)?.preferences?.editor?.fontSize);
    return Number.isFinite(n) && n >= 10 && n <= 24 ? n : 14;
  }, [user]);
  const editorTabSize = useMemo(() => {
    const n = Number((user as any)?.preferences?.editor?.tabSize);
    return Number.isFinite(n) && n >= 2 && n <= 8 ? n : 2;
  }, [user]);
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'discuss'>('description');
  const [testResults, setTestResults] = useState<TestResults>({
    status: 'idle',
    testCases: [],
    results: [],
    testsPassed: 0,
    totalTests: 0,
    isSubmission: false
  });
  
  // Track if user is trying to submit without being logged in
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch problem details
  const fetchProblem = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Use fetch directly to avoid authentication requirements
      const response = await fetch(`${getApiBase()}/problems/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch problem: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProblem(data.problem || data); // Handle both formats: { problem } or direct problem object
      setCode((data.problem || data)?.starterCode?.[selectedLanguage] || getDefaultCode(selectedLanguage));
    } catch (error) {
      console.error('Error fetching problem:', error);
    } finally {
      setLoading(false);
    }
  }, [id, selectedLanguage]);

  // Handle code run (single example)
  const handleRunCode = useCallback(async () => {
    if (!problem || !code.trim()) {
      setTestResults({
        status: 'error',
        error: 'Code cannot be empty',
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
      return;
    }
    
    // Guardrails: language mismatch detection
    const inferred = detectCodeLanguage(code) as Language | null;
    if (inferred && inferred !== selectedLanguage) {
      setTestResults({
        status: 'error',
        error: `Language mismatch: your code looks like ${inferred.toUpperCase()}, but '${selectedLanguage.toUpperCase()}' is selected. Please switch the tab.`,
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
      return;
    }

    // Guardrails: Java must use class Solution
    if (selectedLanguage === 'java' && !validateJavaSolution(code)) {
      setTestResults({
        status: 'error',
        error: "For Java, please define 'class Solution' (we compile Solution.java and run class Solution).",
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
      return;
    }

    setIsRunning(true);
    setTestResults(prev => ({ ...prev, status: 'running', isSubmission: false, error: undefined }));

    try {
      // Build optional stdin from first example if present
      const exampleInput = problem.examples?.[0]?.input ?? '';
      const exampleOutput = problem.examples?.[0]?.output ?? '';
      const payload = {
        language: selectedLanguage,
        files: [{ content: code }],
        ...(typeof exampleInput === 'string' ? { stdin: exampleInput } : {})
      };

      const resp = await fetch(getExecuteUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      const out = (data?.run?.output ?? '').toString();
      const err = (data?.run?.stderr ?? '').toString();
      // Normalize runtime and memory from sandbox responses
      const rawTime = (data?.run?.timeMs ?? data?.run?.time ?? data?.timeMs ?? data?.time) as number | string | undefined;
      const rawMem = (data?.run?.memoryKb ?? data?.run?.memory_kb ?? data?.run?.memory ?? data?.memoryKb ?? data?.memory) as number | string | undefined;
      const parseMs = (v: any): number | undefined => {
        if (v == null) return undefined;
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        if (Number.isNaN(n)) return undefined;
        // Some APIs provide seconds; assume seconds if < 100 (heuristic)
        return n < 100 ? Math.round(n * 1000) : Math.round(n);
      };
      const parseKb = (v: any): number | undefined => {
        if (v == null) return undefined;
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        if (Number.isNaN(n)) return undefined;
        // If appears to be bytes (very large), convert to KB
        return n > 4096 ? Math.round(n / 1024) : Math.round(n);
      };
      const runtimeMs = parseMs(rawTime);
      // Note: memoryKb not used in UI; skip storing to silence lints

      const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
      const hasExpected = typeof exampleOutput === 'string' && exampleOutput.trim().length > 0;
      const passed = hasExpected ? normalize(out) === normalize(exampleOutput) : err.length === 0;

      setTestResults({
        status: err ? 'error' : passed ? 'accepted' : 'error',
        testCases: hasExpected ? [{ input: exampleInput, expectedOutput: exampleOutput }] : [],
        results: hasExpected ? [{ input: exampleInput, expectedOutput: exampleOutput, actualOutput: out, passed, error: err || undefined }] : [],
        testsPassed: passed ? 1 : 0,
        totalTests: hasExpected ? 1 : 0,
        isSubmission: false,
        message: err ? 'Execution error' : undefined,
        error: err || undefined,
        runtimeMs,
        // memoryKb
      });
    } catch (error: unknown) {
      console.error('Error running code:', error);
      const errorMessage = (error as Error)?.message || 'Failed to run code';
      setTestResults({
        status: 'error',
        error: errorMessage,
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, problem, selectedLanguage]);

  // Run all testcases for supported languages
  const handleRunAll = useCallback(async () => {
    if (!problem || !code.trim()) return;
    if (!Array.isArray(problem.testCases) || problem.testCases.length === 0) {
      setTestResults({
        status: 'error',
        error: 'No testcases found for this problem',
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
      return;
    }

    setIsRunning(true);
    setTestResults(prev => ({ ...prev, status: 'running', isSubmission: false, error: undefined }));

    try {
      const results: TestCaseResult[] = [];
      let passedCount = 0;

      const runOne = async (stdin: string | undefined, expected: string | undefined) => {
        const payload = {
          language: selectedLanguage,
          files: [{ content: code }],
          ...(stdin ? { stdin } : {})
        };
        const resp = await fetch(getExecuteUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        const out = (data?.run?.output ?? '').toString();
        const err = (data?.run?.stderr ?? '').toString();
        const rawTime = (data?.run?.timeMs ?? data?.run?.time ?? data?.timeMs ?? data?.time) as number | string | undefined;
        const rawMem = (data?.run?.memoryKb ?? data?.run?.memory_kb ?? data?.run?.memory ?? data?.memoryKb ?? data?.memory) as number | string | undefined;
        const parseMs = (v: any): number | undefined => {
          if (v == null) return undefined;
          const n = typeof v === 'string' ? parseFloat(v) : Number(v);
          if (Number.isNaN(n)) return undefined;
          return n < 100 ? Math.round(n * 1000) : Math.round(n);
        };
        const parseKb = (v: any): number | undefined => {
          if (v == null) return undefined;
          const n = typeof v === 'string' ? parseFloat(v) : Number(v);
          if (Number.isNaN(n)) return undefined;
          return n > 4096 ? Math.round(n / 1024) : Math.round(n);
        };
        const runtimeMs = parseMs(rawTime);
        const memoryKb = parseKb(rawMem);
        const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
        const hasExpected = typeof expected === 'string' && expected.trim().length > 0;
        const passed = hasExpected ? normalize(out) === normalize(expected!) : err.length === 0;
        if (passed) passedCount++;
        results.push({ input: stdin, expectedOutput: expected, actualOutput: out, passed, error: err || undefined, runtime: runtimeMs });
      };

      for (const tc of problem.testCases) {
        const stdin = typeof tc.input === 'string' ? tc.input : undefined;
        const expected = typeof tc.expectedOutput === 'string' ? tc.expectedOutput : undefined;
        await runOne(stdin, expected);
      }

      setTestResults({
        status: passedCount === problem.testCases.length ? 'accepted' : 'error',
        testCases: problem.testCases as any,
        results,
        testsPassed: passedCount,
        totalTests: problem.testCases.length,
        isSubmission: false
      });
    } catch (e: any) {
      setTestResults({
        status: 'error',
        error: e?.message || 'Failed to run all testcases',
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: false
      });
    } finally {
      setIsRunning(false);
    }
  }, [problem, code, selectedLanguage]);

  // Handle code submission
  const handleSubmitCode = useCallback(async () => {
    if (!problem || !code.trim()) {
      setTestResults({
        status: 'error',
        error: 'Code cannot be empty',
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: 0,
        isSubmission: true
      });
      return;
    }
    
    // Require login for submission
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsSubmitting(true);
    setTestResults(prev => ({
      ...prev,
      status: 'running',
      isSubmission: true,
      error: undefined
    }));

    try {
      // Server expects POST /api/problems/:id/submit with { code, language, contestId? }
      const resp = await api.post<{ submission: any; result: any }>(`/problems/${problem._id}/submit`, {
        code,
        language: selectedLanguage,
      });

      const payload = (resp as any).data || resp; // our api wrapper returns { data }
      const result = payload.result || {};

      // Normalize status to our TestStatus union with wider coverage
      const rawStatus = (result.status || '').toString().toLowerCase();
      const errorish = ['wrong answer', 'runtime error', 'time limit exceeded', 'compilation error', 'failed'];
      const status: TestStatus =
        rawStatus === 'accepted' ? 'accepted' :
        rawStatus === 'running' ? 'running' :
        rawStatus === 'success' ? 'success' :
        rawStatus === 'error' || errorish.includes(rawStatus) ? 'error' :
        'submitted';

      const updatedResults: TestResults = {
        status,
        testCases: [], // server does not return testCases here
        results: [], // condensed summary; details not returned from submit endpoint
        testsPassed: Number(result.testsPassed || 0),
        totalTests: Number(result.totalTests || problem.testCases?.length || 0),
        isSubmission: true,
        message: result.message,
        error: result.error,
        runtimeMs: typeof result.runtime === 'number' ? result.runtime : undefined,
        memoryKb: typeof result.memory === 'number' ? result.memory : undefined,
        earnedCodecoin: !!result.earnedCodecoin,
      };

      setTestResults(updatedResults);

      // Refresh user data if codecoins were earned
      if (status === 'accepted' && refreshUser) {
        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting code:', error);
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        (error as Error)?.message || 
        'Failed to submit code';
      
      setTestResults({
        status: 'error',
        error: errorMessage,
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: problem.testCases?.length || 0,
        isSubmission: true
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, problem, selectedLanguage, refreshUser]);

  // Handle code reset
  const handleResetCode = useCallback(() => {
    setCode(problem?.starterCode?.[selectedLanguage] || getDefaultCode(selectedLanguage));
    setTestResults({
      status: 'idle',
      testCases: [],
      results: [],
      testsPassed: 0,
      totalTests: 0,
      isSubmission: false
    });
  }, [problem, selectedLanguage]);

  // Load problem on mount or when id changes
  useEffect(() => {
    if (id) {
      fetchProblem();
    }
  }, [id, fetchProblem]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode?.[selectedLanguage] || getDefaultCode(selectedLanguage));
    }
  }, [selectedLanguage, problem]);

  // Utility functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-50 border-green-300';
      case 'Medium':
        return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'Hard':
        return 'text-red-600 bg-red-50 border-red-300';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-300';
    }
  };

  const getCurrentTime = () => {
    // Show actual time without seconds (HH:MM with locale)
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format helpers for runtime and memory
  const formatRuntime = (ms?: number) => {
    if (ms == null || Number.isNaN(ms)) return '--';
    return `${Math.round(ms)} ms`;
  };
  const formatMemory = (kb?: number) => {
    if (kb == null || Number.isNaN(kb)) return '--';
    // Show in KB with no decimals if >= 1KB, else show in bytes
    if (kb < 1) return `${Math.round(kb * 1024)} B`;
    return `${Math.round(kb)} KB`;
  };

  // Auth check
  if (!user) {
    return <Navigate to="/login" state={{ from: `/problems/${id}` }} replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
          <p className="text-blue-700 font-medium text-sm">Loading problem...</p>
        </div>
      </div>
    );
  }

  // Problem not found
  if (!problem) {
    return <Navigate to="/problems" replace />;
  }

  // Safely check if problem is solved (for authenticated users)
  const isSolved = user?.solvedProblems?.some((p: any) => 
    (typeof p === 'object' ? p._id === problem._id : p === problem._id)
  ) || false;

  // Show login prompt modal
  const renderLoginPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border-2 border-blue-200">
        <h3 className="text-lg font-bold mb-3 text-blue-900">Sign In Required</h3>
        <p className="mb-5 text-blue-700 text-sm">You need to be signed in to submit or run code. Please log in or create an account.</p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-300 transition-colors"
          >
            Cancel
          </button>
          <Link
            to="/login"
            state={{ from: window.location.pathname }}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
  
  // Render login prompt for unauthenticated users trying to access restricted actions
  if (showLoginPrompt) {
    return renderLoginPrompt();
  }

  return (
    <div className="min-h-screen bg-blue-50 text-blue-900">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {/* Left Panel - Problem Description */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border-2 border-blue-200 p-3 sm:p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-bold text-blue-900">
                    {problem.title}
                  </h1>
                  {isSolved && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border-2 ${getDifficultyColor(problem.difficulty)} self-start sm:self-auto`}>
                  {problem.difficulty}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 text-xs text-blue-700">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
                  <span>{problem.acceptance || 0}% Accepted</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
                  <a href="/submissions" className="text-blue-600 hover:underline"><span>{problem.submissions || 0} Submissions</span></a> 
                </div>
                <div className="flex items-center">
                  <Award className="h-3 w-3 mr-1 text-yellow-600 flex-shrink-0" />
                  <span>1 Codecoin</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-4 border-b-2 border-blue-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${
                    activeTab === 'description'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('editorial')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'editorial'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  Editorial
                </button>
                <button
                  onClick={() => setActiveTab('discuss')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${
                    activeTab === 'discuss'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Discuss
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                      {problem.description}
                    </p>
                  </div>

                  {problem.examples && problem.examples.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-3">Examples</h3>
                      <div className="space-y-3">
                        {problem.examples.map((example, index) => (
                          <div key={index} className="bg-blue-100 rounded-xl p-3 border-2 border-blue-200">
                            <p className="text-blue-900 font-medium mb-2 text-xs">Example {index + 1}:</p>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <span className="text-blue-700 font-medium">Input: </span>
                                <code className="text-blue-800 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                                  {example.input}
                                </code>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Output: </span>
                                <code className="text-green-800 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                  {example.output}
                                </code>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="text-blue-700 font-medium">Explanation: </span>
                                  <span className="text-blue-800">{example.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {problem.constraints && problem.constraints.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-3">Constraints</h3>
                      <ul className="space-y-0.5">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index} className="text-blue-800 flex items-start text-xs">
                            <span className="text-blue-600 mr-1.5 font-bold">•</span>
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'editorial' && (
                <div className="text-center py-8">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-blue-700 font-medium text-sm">Editorial available after solving the problem</p>
                </div>
              )}

              {activeTab === 'discuss' && (
                <div className="text-center py-8">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-blue-700 font-medium text-sm">No discussions yet. Be the first to start one!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden">
              <div className="border-b-2 border-blue-200">
                {/* Language Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 py-2 bg-blue-50 space-y-2 sm:space-y-0">
                  <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                    {(['javascript', 'typescript', 'python', 'java', 'cpp'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-blue-700 hover:text-blue-900 hover:bg-white border border-blue-200'
                        }`}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleResetCode}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Reset code"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-3 w-3" />
                      <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                    <button
                      onClick={handleRunAll}
                      disabled={isRunning || !problem?.testCases?.length}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{isRunning ? 'Running...' : 'Run All Testcases'}</span>
                    </button>
                    
                    <button
                      onClick={handleSubmitCode}
                      disabled={isSubmitting}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Code Editor (Monaco) */}
              <div className="relative">
                <Editor
                  height="60vh"
                  theme={editorTheme}
                  language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    fontSize: editorFontSize,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    automaticLayout: true,
                    smoothScrolling: true,
                    scrollbar: { verticalScrollbarSize: 12, horizontalScrollbarSize: 12 },
                    tabSize: editorTabSize,
                    insertSpaces: true,
                    bracketPairColorization: { enabled: true },
                    renderWhitespace: 'selection',
                    renderControlCharacters: false,
                  }}
                />
              </div>
              
              {/* Status Bar */}
              <div className="bg-blue-100 px-3 py-1.5 text-xs text-blue-700 border-t-2 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between space-y-0.5 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{selectedLanguage.toUpperCase()}</span>
                  <span>{code.length} characters</span>
                </div>
                <span className="font-medium">{getCurrentTime()}</span>
              </div>
            </div>

            {/* Test Results */}
            {(testResults.status !== 'idle' || isRunning || isSubmitting) && (
              <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden">
                <div className="bg-blue-100 px-3 py-2 border-b-2 border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                    <h3 className="font-medium text-blue-900 text-sm">
                      {testResults.isSubmission ? 'Submission Results' : 'Test Results'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-blue-700">
                      <span><span className="font-medium">Runtime:</span> {formatRuntime(testResults.runtimeMs)}</span>
                      <span><span className="font-medium">Memory:</span> {formatMemory(testResults.memoryKb)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  {(isRunning || isSubmitting) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600 mr-2"></div>
                      <span className="text-blue-700 font-medium text-sm">
                        {isSubmitting ? 'Submitting solution...' : 'Running code...'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div className={`p-3 rounded-xl border-2 ${
                        testResults.status === 'accepted' 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <div className="flex items-center">
                          {testResults.status === 'accepted' ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                          )}
                          <div>
                            <h4 className="text-xs font-medium text-gray-900">
                              {testResults.status === 'accepted' ? 'Solution Accepted!' : 'Solution Failed'}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Tests passed: {testResults.testsPassed}/{testResults.totalTests}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Codecoin Reward */}
                      {testResults.earnedCodecoin && (
                        <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-yellow-800">Codecoin Earned!</p>
                              <p className="text-xs text-yellow-700">You've earned 1 Codecoin for solving this problem.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Display */}
                      {testResults.error && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                          <p className="text-red-800 text-xs font-medium mb-1">Error:</p>
                          <p className="text-red-700 text-xs font-mono break-all">{testResults.error}</p>
                        </div>
                      )}

                      {/* Test Case Results */}
                      {testResults.results && testResults.results.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-900 text-sm">Test Cases:</h4>
                          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                            {testResults.results.map((result: TestCaseResult, index: number) => {
                              const bgClass = result.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300';
                              const textClass = result.passed ? 'text-green-800' : 'text-red-800';
                              return (
                                <div key={index} className={`p-3 rounded-xl border-2 ${bgClass}`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-0.5 sm:space-y-0">
                                    <span className={`text-xs font-medium ${textClass}`}>
                                      Test {index + 1} - {result.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                    {result.runtime && (
                                      <span className="text-xs text-gray-600 font-medium">
                                        {result.runtime} ms
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <span className="text-blue-700 font-medium">Input:</span>
                                      <div className="bg-blue-100 p-2 rounded-lg mt-1 border border-blue-200">
                                        <code className="text-blue-800 break-all">
                                          {JSON.stringify(result.input, null, 2)}
                                        </code>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <span className="text-blue-700 font-medium">Expected:</span>
                                      <div className="bg-green-100 p-2 rounded-lg mt-1 border border-green-200">
                                        <code className="text-green-800 break-all">
                                          {JSON.stringify(result.expectedOutput, null, 2)}
                                        </code>
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-blue-700 font-medium">Output:</span>
                                      <div className={`p-2 rounded-lg mt-1 border-2 ${result.passed ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                                        <code className={`break-all ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                                          {JSON.stringify(result.actualOutput, null, 2)}
                                        </code>
                                      </div>
                                    </div>
                                    
                                    {!result.passed && result.error && (
                                      <div className="mt-2 text-red-700 bg-red-100 p-2 rounded-lg border border-red-200">
                                        <span className="font-medium">Error: </span>
                                        <span className="break-all">{result.error}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t-2 border-blue-200">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-900">
                            {testResults.testsPassed}/{testResults.totalTests}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Tests Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-900">
                            {testResults.runtimeMs ? `${testResults.runtimeMs}ms` : '--'}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Runtime</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-900">
                            {testResults.memoryKb ? `${Math.round(testResults.memoryKb / 1024 * 10) / 10} MB` : '--'}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Memory</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;