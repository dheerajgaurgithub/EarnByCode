import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Trophy, Award, Play, AlertCircle, Clock3, Settings, Bot, Flame } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/context/I18nContext';

// Build normalized API base (favor env, then production backend)
const getApiBase = () => {
  const raw = (import.meta.env.VITE_API_URL as string) || 'https://earnbycode-mfs3.onrender.com/api';
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

// Resolve compiler API base for new Docker sandbox
const getCompilerBase = () => {
  const env: any = (import.meta as any).env || {};
  const override = env.VITE_COMPILER_API as string | undefined;
  if (override && override.trim()) {
    let base = override.trim();
    base = base.replace(/\/+$/, '');
    // If someone sets full path ending with /compile, strip it to avoid /compile/compile
    base = base.replace(/\/compile$/i, '');
    return base;
  }
  return '';
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
  // Optional human-formatted strings from executor/server, e.g., '121ms', '16.4MB'
  runtimeText?: string;
  memoryText?: string;
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
  const { t } = useI18n();
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
  // Java helper: warn if class name is not Solution (server expects Solution.java)
  const javaNeedsSolutionClass = useMemo(() => {
    if (selectedLanguage !== 'java') return false;
    const s = String(code || '');
    return !/\bclass\s+Solution\b/.test(s);
  }, [selectedLanguage, code]);
  // Non-hidden testcases fetched from backend endpoint
  const [visibleTestcases, setVisibleTestcases] = useState<Array<{ input: string; expectedOutput: string }>>([]);
  // Toolbar UI state
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Daily problem state
  const [dailyProblem, setDailyProblem] = useState<{ date: string; problemId: string } | null>(null);
  // Chat state (simple stub)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  // Preferences (persisted)
  const [prefs, setPrefs] = useState<{ autoStartTimer: boolean; defaultTimerMin: number; openChatByDefault: boolean }>({
    autoStartTimer: false,
    defaultTimerMin: 25,
    openChatByDefault: false,
  });
  // Strict Engine Mode state
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [strictReport, setStrictReport] = useState<string>('');
  const [customTests, setCustomTests] = useState<string>('');
  const [compareExpected, setCompareExpected] = useState<boolean>(false);
  const [tleMs, setTleMs] = useState<number>(5000);
  const [copied, setCopied] = useState<boolean>(false);
  const [normalizeJavaDecimals, setNormalizeJavaDecimals] = useState<boolean>(true);
  
  // Track if user is trying to submit without being logged in
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Ref for timer popover to support click-outside close
  const timerRef = useRef<HTMLDivElement | null>(null);

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
      // Also fetch non-hidden testcases from dedicated endpoint
      try {
        const tcRes = await fetch(`${getApiBase()}/problems/${id}/testcases`);
        if (tcRes.ok) {
          const raw = await tcRes.json();
          const arr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.testcases) ? raw.testcases : []);
          const vis = arr
            .filter((t: any) => {
              const hidden = t?.hidden ?? t?.isHidden ?? (t?.visibility === 'hidden') ?? (t?.private === true);
              return !hidden;
            })
            .map((t: any) => ({
              input: String(t?.input ?? ''),
              expectedOutput: String(
                t?.expectedOutput ?? t?.expected ?? t?.expected_output ?? t?.outputExpected ?? t?.output ?? ''
              ),
            }));
          setVisibleTestcases(vis);
        } else {
          setVisibleTestcases([]);
        }
      } catch {
        setVisibleTestcases([]);
      }
    } catch (error) {
      console.error('Error fetching problem:', error);
    } finally {
      setLoading(false);
    }
  }, [id, selectedLanguage]);

  // Fallback: if endpoint provided nothing, but problem has testCases, show them (assuming they are the public ones)
  useEffect(() => {
    if (visibleTestcases.length === 0 && Array.isArray(problem?.testCases) && problem!.testCases.length > 0) {
      const vis = (problem!.testCases as any[]).map(t => ({
        input: String((t as any)?.input ?? ''),
        expectedOutput: String((t as any)?.expectedOutput ?? (t as any)?.expected ?? ''),
      }));
      setVisibleTestcases(vis);
    }
  }, [problem?.testCases, visibleTestcases.length]);

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

    setIsRunning(true);
    setTestResults(prev => ({ ...prev, status: 'running', isSubmission: false, error: undefined }));

    try {
      // Prefer first visible (non-hidden) testcase; fallback to first example
      const tc0 = visibleTestcases && visibleTestcases.length > 0 ? visibleTestcases[0] : undefined;
      const runInput = tc0 ? tc0.input : (problem.examples?.[0]?.input ?? '');
      const expectedText = tc0 ? tc0.expectedOutput : (problem.examples?.[0]?.output ?? '');
      const payload = {
        code,
        language: selectedLanguage,
        input: typeof runInput === 'string' ? runInput : ''
      };
      const resp = await fetch(`${getCompilerBase()}/compile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(()=>'');
        if (resp.status === 503 && /Docker is not available/i.test(txt)) {
          throw new Error('Backend cannot run code: Docker is not available on the server. Please deploy backend on a Docker-capable host.');
        }
        throw new Error(`Compile HTTP ${resp.status}: ${txt}`);
      }
      const data = await resp.json();
      const out = (data?.stdout ?? data?.output ?? '').toString();
      const err = (data?.stderr ?? '').toString();
      const runtimeMs = typeof data?.runtimeMs === 'number' ? data.runtimeMs : undefined;
      const memoryKb = typeof data?.memoryKb === 'number' ? data.memoryKb : undefined;
      const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
      const hasExpected = typeof expectedText === 'string' && expectedText.trim().length > 0;
      const passed = hasExpected ? normalize(out) === normalize(expectedText) : !err;

      setTestResults({
        status: err ? 'error' : passed ? 'accepted' : 'error',
        testCases: hasExpected ? [{ input: runInput, expectedOutput: expectedText }] : [],
        results: hasExpected ? [{ input: runInput, expectedOutput: expectedText, actualOutput: out, passed, error: err || undefined }] : [],
        testsPassed: passed ? 1 : 0,
        totalTests: hasExpected ? 1 : 0,
        isSubmission: false,
        message: err ? 'Execution error' : undefined,
        error: err || undefined,
        runtimeMs,
        memoryKb,
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
      let totalMs = 0;

      const runOne = async (stdin: string | undefined, expected: string | undefined) => {
        const payload = {
          code,
          language: selectedLanguage,
          input: typeof stdin === 'string' ? stdin : ''
        } as any;
        const resp = await fetch(`${getCompilerBase()}/compile`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(()=> '');
          if (resp.status === 503 && /Docker is not available/i.test(txt)) {
            throw new Error('Backend cannot run code: Docker is not available on the server. Please deploy backend on a Docker-capable host.');
          }
          throw new Error(`Compile HTTP ${resp.status}: ${txt}`);
        }
        const data = await resp.json();
        const out = (data?.stdout ?? data?.output ?? '').toString();
        const err = (data?.stderr ?? '').toString();
        const runtimeMs = typeof data?.runtimeMs === 'number' ? data.runtimeMs : undefined;
        const memoryKb = typeof data?.memoryKb === 'number' ? data.memoryKb : undefined;
        const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
        const hasExpected = typeof expected === 'string' && expected.trim().length > 0;
        const passed = hasExpected ? normalize(out) === normalize(expected!) : !err;
        if (passed) passedCount++;
        results.push({ input: stdin, expectedOutput: expected, actualOutput: out, passed, error: err || undefined, runtime: runtimeMs });
        if (runtimeMs) totalMs += runtimeMs;
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
        isSubmission: false,
        runtimeMs: totalMs > 0 ? totalMs : undefined,
        runtimeText: totalMs > 0 ? `${Math.round(totalMs)}ms` : undefined
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

  // Strict execution engine per requested format
  const executeStrict = useCallback(async () => {
    if (!code.trim()) {
      setStrictReport(
        '**Status:** Compilation Error\n**Details:**\nCode cannot be empty.'
      );
      return;
    }

    // Build test inputs
    const inputs: string[] = (() => {
      const txt = customTests.trim();
      if (txt.length > 0) {
        // Split tests by double newlines; fallback to single block
        const parts = txt.split(/\n\n+/).map(s => s.replace(/\s+$/,'')).filter(Boolean);
        return parts.length > 0 ? parts : [txt];
      }
      // Fallback to problem testCases if present (string inputs only)
      const fromProblem = (problem?.testCases || [])
        .map(tc => (typeof tc.input === 'string' ? tc.input : ''))
        .filter(Boolean);
      return fromProblem.length > 0 ? fromProblem : [''];
    })();
    // Expected outputs aligned to inputs (only when not providing custom tests)
    const expectedList: (string | undefined)[] = (() => {
      if (customTests.trim().length > 0) return inputs.map(() => undefined);
      const arr = (problem?.testCases || []).map(tc => (typeof tc.expectedOutput === 'string' ? tc.expectedOutput : undefined));
      return arr;
    })();

    // Map file per language
    const fileForLang = (lang: Language) => {
      switch (lang) {
        case 'javascript': return { name: 'index.js', content: code };
        case 'python': return { name: 'main.py', content: code };
        case 'java': return { name: 'Solution.java', content: code };
        case 'cpp': return { name: 'main.cpp', content: code };
      }
    };
    const pistonLang: Record<Language, string> = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
    };

    // First do a compilation check (where supported) with empty stdin
    try {
      const prePayload = {
        code,
        language: selectedLanguage,
        input: ''
      } as any;
      const pre = await fetch(`${getCompilerBase()}/compile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prePayload)
      });
      const preData = await pre.json();
      const compileErr = (preData?.stderr || '').toString();
      const compileCode = Number(preData?.exitCode ?? 0);
      if (compileErr && compileCode !== 0) {
        const details = compileErr.replace(/\r\n/g,'\n');
        setStrictReport(`**Status:** Compilation Error\n**Details:**\n${details}`);
        return;
      }
    } catch (e: any) {
      setStrictReport(`**Status:** Compilation Error\n**Details:**\n${e?.message || 'Executor unavailable'}`);
      return;
    }

    // Execute each test case
    let report = '[START OF EXECUTION]\n\nCompilation Phase:\n';
    report += 'On Success: proceeding to execution...\n\n';

    let idx = 1;
    for (const input of inputs) {
      try {
        const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const stdinToUse = (selectedLanguage === 'java' && normalizeJavaDecimals && typeof input === 'string')
          ? input.replace(/(\d),(?=\d)/g, '$1.')
          : input;
        const payload = {
          language: pistonLang[selectedLanguage] || selectedLanguage,
          version: '*',
          files: [fileForLang(selectedLanguage)],
          ...(typeof stdinToUse === 'string' ? { stdin: stdinToUse } : {})
        } as any;
        // TLE with AbortController
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(tleMs) || 5000));
        let tle = false;
        let resp: Response;
        try {
          resp = await fetch(`${getCompilerBase()}/compile`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal
          });
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            tle = true;
          } else {
            throw err;
          }
        } finally {
          clearTimeout(timer);
        }
        if (tle) {
          const timeText = `${Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)}ms`;
          report += `---\n**Test Case #${idx}:**\n`;
          report += `**Input:**\n${input || '[No input]'}\n\n`;
          report += `**Your Output (stdout):**\n[No output]\n\n`;
          report += `**Error Output (stderr):**\n[No errors]\n\n`;
          report += `**Result:** Time Limit Exceeded\n`;
          report += `**Execution Time:** ${timeText}\n`;
          report += `**Memory Usage:** N/A\n\n`;
          idx += 1;
          continue;
        }
        const data = await resp!.json();
        const stdout = (data?.run?.output ?? data?.run?.stdout ?? data?.stdout ?? '').toString();
        const stderr = (data?.run?.stderr ?? data?.stderr ?? '').toString();
        const rawTime = (data?.run?.timeMs ?? data?.run?.time ?? data?.timeMs ?? data?.time);
        const rawMem = (data?.run?.memoryKb ?? data?.run?.memory_kb ?? data?.run?.memory ?? data?.memoryKb ?? data?.memory);
        const parseMs = (v: any): number | undefined => {
          if (v == null) return undefined; const n = typeof v === 'string' ? parseFloat(v) : Number(v); if (Number.isNaN(n)) return undefined; return n < 100 ? Math.round(n * 1000) : Math.round(n);
        };
        const parseKb = (v: any): number | undefined => {
          if (v == null) return undefined; const n = typeof v === 'string' ? parseFloat(v) : Number(v); if (Number.isNaN(n)) return undefined; return n > 4096 ? Math.round(n / 1024) : Math.round(n);
        };
        const providedMs = parseMs(rawTime);
        const measuredMs = Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0));
        const timeMs = providedMs ?? measuredMs;
        const memKb = parseKb(rawMem);
        const memText = typeof memKb === 'number' ? (memKb >= 1024 ? `${(memKb/1024).toFixed(1)} MB` : `${Math.round(memKb)} KB`) : 'N/A';
        const timeText = `${Math.round(timeMs || 0)}ms`;
        // Detect executor-side TLE heuristics
        const killed = (data?.run?.signal === 'SIGKILL') || /time limit exceeded/i.test(stderr || '') || Number(data?.run?.code) === 137;
        const result = killed ? 'Time Limit Exceeded' : (stderr ? 'Runtime Error' : 'Success');

        report += `---\n**Test Case #${idx}:**\n`;
        report += `**Input:**\n${input || '[No input]'}\n\n`;
        report += `**Your Output (stdout):**\n${stdout ? stdout : '[No output]'}\n\n`;
        report += `**Error Output (stderr):**\n${stderr ? stderr : '[No errors]'}\n\n`;
        report += `**Result:** ${result}\n`;
        report += `**Execution Time:** ${timeText}\n`;
        report += `**Memory Usage:** ${memKb != null ? memText : 'N/A'}\n`;
        if (compareExpected) {
          const expected = expectedList[idx - 1];
          if (typeof expected === 'string') {
            const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
            const passed = normalize(stdout) === normalize(expected);
            report += `**Expected Output:**\n${expected}\n`;
            report += `**Comparison:** ${passed ? 'Passed' : 'Failed'}\n`;
          } else {
            report += `**Comparison:** N/A\n`;
          }
        }
        report += `\n`;
      } catch (e: any) {
        report += `---\n**Test Case #${idx}:**\n`;
        report += `**Input:**\n${input || '[No input]'}\n\n`;
        report += `**Your Output (stdout):**\n[No output]\n\n`;
        report += `**Error Output (stderr):**\n${e?.message || 'Unknown error'}\n\n`;
        report += `**Result:** Runtime Error\n`;
        report += `**Execution Time:** 0ms\n`;
        report += `**Memory Usage:** N/A\n\n`;
      } finally {
        idx += 1;
      }
    }

    setStrictReport(report.trimEnd());
  }, [code, customTests, problem?.testCases, selectedLanguage, compareExpected, tleMs]);

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
    // For Java, server expects class Solution
    if (selectedLanguage === 'java' && !validateJavaSolution(code)) {
      setTestResults({
        status: 'error',
        error: "For Java solutions, the public class must be named 'Solution' (file Solution.java).",
        testCases: [],
        results: [],
        testsPassed: 0,
        totalTests: problem.testCases?.length || 0,
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

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd:prefs');
      if (raw) setPrefs(prev => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // Persist preferences on change
  useEffect(() => {
    try { localStorage.setItem('pd:prefs', JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  // Fetch user's daily problem
  useEffect(() => {
    const loadDaily = async () => {
      try {
        const resp = await api.get<{ dailyProblem: { date: string; problemId: string } | null }>(`/users/me/daily-problem`);
        const payload = (resp as any).data || resp;
        setDailyProblem(payload.dailyProblem || null);
      } catch {}
    };
    if (user) loadDaily();
  }, [user]);

  const isTodaysProblem = useMemo(() => {
    if (!problem || !dailyProblem) return false;
    return String(dailyProblem.problemId) === String(problem._id);
  }, [problem, dailyProblem]);

  // Removed per-user 'set as today's problem' in favor of admin-managed daily problem

  // Timer tick
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const t = setInterval(() => setTimerSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timerRunning, timerSeconds]);

  // Close timer popover on outside click or Escape
  useEffect(() => {
    if (!showTimer) return;
    const handleDown = (e: MouseEvent | TouchEvent) => {
      const el = timerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowTimer(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTimer(false);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('touchstart', handleDown, { passive: true });
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('touchstart', handleDown as any);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showTimer]);

  // Load per-problem timer state and maybe autostart
  useEffect(() => {
    if (!problem) return;
    const key = `pd:timer:${problem._id}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        setTimerSeconds(typeof saved.seconds === 'number' ? saved.seconds : 0);
        setTimerRunning(!!saved.running);
      } else if (prefs.autoStartTimer && prefs.defaultTimerMin > 0) {
        setTimerSeconds(prefs.defaultTimerMin * 60);
        setTimerRunning(true);
      }
    } catch {}
    // Open chat by default if preference
    if (prefs.openChatByDefault) setShowChat(true);
  }, [problem?._id, prefs.autoStartTimer, prefs.defaultTimerMin, prefs.openChatByDefault]);

  // Persist per-problem timer state
  useEffect(() => {
    if (!problem) return;
    const key = `pd:timer:${problem._id}`;
    try { localStorage.setItem(key, JSON.stringify({ seconds: timerSeconds, running: timerRunning })); } catch {}
  }, [problem, timerSeconds, timerRunning]);

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
  const formatRuntime = (ms?: number, text?: string) => {
    if (text && typeof text === 'string') return text; // prefer server-provided string like '121ms'
    if (ms == null || Number.isNaN(ms)) return 'N/A';
    return `${Math.round(ms)} ms`;
  };
  const formatMemory = (kb?: number, text?: string) => {
    if (text && typeof text === 'string') return text; // prefer server-provided string like '16.4MB'
    if (kb == null || Number.isNaN(kb)) return 'N/A';
    // Prefer MB with one decimal if >= 1024 KB
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
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
          <p className="text-blue-700 font-medium text-sm">{t('problem.loading')}</p>
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
      <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-lg border border-blue-200">
        <h3 className="text-base font-bold mb-2 text-blue-900">{t('login.required.title')}</h3>
        <p className="mb-4 text-blue-700 text-sm">{t('login.required.desc')}</p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-md border border-blue-300 transition-colors"
          >
            {t('login.required.cancel')}
          </button>
          <Link
            to="/login"
            state={{ from: window.location.pathname }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            {t('login.required.login')}
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
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-slate-100 dark:bg-gradient-to-br dark:from-black dark:via-gray-900 dark:to-green-950 text-slate-800 dark:text-green-100 transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
          {/* Left Panel - Problem Description */}
          <div className="space-y-4">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-sky-200 dark:border-green-800 p-4 lg:p-5 shadow-lg shadow-sky-200/50 dark:shadow-green-900/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base lg:text-lg xl:text-xl font-black text-slate-900 dark:text-green-100 leading-tight">
                    {problem.title}
                  </h1>
                  {isSolved && <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600 dark:text-green-400 flex-shrink-0" />}
                  {isTodaysProblem && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-100 to-amber-100 dark:from-green-900/50 dark:to-green-800/50 text-orange-700 dark:text-green-300 border border-orange-200 dark:border-green-700">
                      <Flame className="w-2.5 h-2.5 mr-1 text-orange-500 dark:text-green-400" /> Today's Problem
                    </span>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(problem.difficulty)} self-start lg:self-auto`}>
                  {problem.difficulty}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-4 text-xs text-slate-600 dark:text-green-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-green-400 flex-shrink-0" />
                  <span className="font-medium">{t('problem.accepted').replace('{p}', String(problem.acceptance || 0))}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Trophy className="h-3 w-3 text-sky-600 dark:text-green-400 flex-shrink-0" />
                  <a href="/submissions" className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 font-medium hover:underline transition-colors">
                    <span>{t('problem.submissions_chip').replace('{n}', String(problem.submissions || 0))}</span>
                  </a> 
                </div>
                <div className="flex items-center space-x-1.5">
                  <Award className="h-3 w-3 text-amber-600 dark:text-green-400 flex-shrink-0" />
                  <span className="font-medium">{t('problem.codecoin')}</span>
                </div>
              </div>

              {/* Action bar: timer, chat */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {/* Set-as-today removed; managed by admins in Admin Panel */}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Timer */}
                  <div className="relative" ref={timerRef}>
                    <button onClick={() => setShowTimer(v => !v)} className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-100 dark:bg-green-900/50 border border-sky-200 dark:border-green-700 text-sky-700 dark:text-green-300 hover:bg-sky-200 dark:hover:bg-green-800/70 transition-all duration-200 shadow-sm hover:shadow-md">
                      <Clock3 className="w-2.5 h-2.5 mr-1" /> {timerSeconds > 0 ? `${Math.floor(timerSeconds/60)}:${String(timerSeconds%60).padStart(2,'0')}` : 'Timer'}
                    </button>
                    {showTimer && (
                      <div className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-sky-200 dark:border-green-800 rounded-xl shadow-xl p-3 z-20">
                        <div className="text-xs text-slate-800 dark:text-green-100 mb-2 font-bold">Set Timer</div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {[10,15,25,30,45,60].map(m => (
                            <button key={m} onClick={() => { setTimerSeconds(m*60); setTimerRunning(true); setShowTimer(false); }} className="px-2 py-1 text-xs font-medium border border-sky-200 dark:border-green-800 rounded-lg hover:bg-sky-100 dark:hover:bg-green-900/50 text-slate-700 dark:text-green-300 transition-all duration-200">{m}m</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setTimerRunning(true); setShowTimer(false); }} className="px-2.5 py-1 text-xs font-bold bg-emerald-600 dark:bg-green-600 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-green-700 transition-colors shadow-sm">Start</button>
                          <button onClick={() => { setTimerRunning(false); setShowTimer(false); }} className="px-2.5 py-1 text-xs font-bold bg-amber-500 dark:bg-green-600 text-white rounded-lg hover:bg-amber-600 dark:hover:bg-green-700 transition-colors shadow-sm">Pause</button>
                          <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); setShowTimer(false); }} className="px-2.5 py-1 text-xs font-bold bg-red-600 dark:bg-green-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-green-700 transition-colors shadow-sm">Reset</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Chat toggle */}
                  <button onClick={() => setShowChat(v => !v)} className={`inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${showChat ? 'bg-purple-600 dark:bg-green-600 text-white border-purple-600 dark:border-green-600' : 'bg-purple-100 dark:bg-green-900/50 text-purple-700 dark:text-green-300 border-purple-200 dark:border-green-700 hover:bg-purple-200 dark:hover:bg-green-800/70'}`}>
                    <Bot className="w-2.5 h-2.5 mr-1" /> {showChat ? 'Hide' : 'Chat'}
                  </button>
                  {/* Settings */}
                  <button onClick={() => setShowSettings(true)} className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-green-900/50 border border-slate-200 dark:border-green-700 text-slate-700 dark:text-green-300 hover:bg-slate-200 dark:hover:bg-green-800/70 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Settings className="w-2.5 h-2.5 mr-1" /> Settings
                  </button>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-green-100 mb-2">Description</h3>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-green-200 whitespace-pre-line">
                    {problem.description}
                  </p>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-green-100 mb-2">{t('problem.examples')}</h3>
                    <div className="space-y-3">
                      {problem.examples.map((example, index) => (
                        <div key={index} className="bg-sky-50 dark:bg-green-900/30 rounded-xl p-3 border border-sky-200 dark:border-green-800">
                          <p className="text-slate-900 dark:text-green-100 font-bold mb-2 text-xs">{t('problem.example_n').replace('{i}', String(index + 1))}</p>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-sky-700 dark:text-green-300 font-bold">{t('problem.input')}</span>
                              <div className="mt-1 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-sky-200 dark:border-green-800 p-2">
                                <code className="text-slate-800 dark:text-green-200 break-all">{example.input}</code>
                              </div>
                            </div>
                            <div>
                              <span className="text-sky-700 dark:text-green-300 font-bold">{t('problem.output')}</span>
                              <div className="mt-1 bg-emerald-50/70 dark:bg-green-900/40 rounded-lg border border-emerald-200 dark:border-green-800 p-2">
                                <code className="text-emerald-800 dark:text-green-200 break-all">{example.output}</code>
                              </div>
                            </div>
                            {example.explanation && (
                              <div>
                                <span className="text-sky-700 dark:text-green-300 font-bold">{t('problem.explanation')}</span>
                                <div className="mt-1 text-slate-800 dark:text-green-200">{example.explanation}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Visible Test Cases (non-hidden) */}
                {visibleTestcases.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-green-100 mb-2">Test Cases</h3>
                    <div className="space-y-3">
                      {visibleTestcases.map((tc, index) => (
                        <div key={index} className="bg-sky-50 dark:bg-green-900/30 rounded-xl p-3 border border-sky-200 dark:border-green-800">
                          <p className="text-slate-900 dark:text-green-100 font-bold mb-2 text-xs">Test {index + 1}</p>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-sky-700 dark:text-green-300 font-bold">Input:</span>
                              <pre className="bg-white dark:bg-gray-900/60 p-2 rounded-lg mt-1 border border-sky-200 dark:border-green-800 overflow-auto whitespace-pre-wrap break-words">{tc.input}</pre>
                            </div>
                            <div>
                              <span className="text-sky-700 dark:text-green-300 font-bold">Expected:</span>
                              <pre className="bg-emerald-100 dark:bg-green-900/40 p-2 rounded-lg mt-1 border border-emerald-200 dark:border-green-800 overflow-auto whitespace-pre-wrap break-words">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-green-100 mb-2">{t('problem.constraints')}</h3>
                    <ul className="space-y-1">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index} className="text-slate-800 dark:text-green-200 flex items-start text-xs">
                          <span className="text-sky-600 dark:text-green-400 mr-2 font-bold">•</span>
                          <span>{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="space-y-4">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-sky-200 dark:border-green-800 shadow-xl shadow-sky-200/50 dark:shadow-green-900/40 overflow-hidden">
              <div className="border-b border-sky-200 dark:border-green-800">
                {/* Language Tabs */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-50 to-slate-100 dark:from-green-950/50 dark:to-gray-900/80 space-y-2 lg:space-y-0">
                  <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
                    {(['javascript', 'python', 'java', 'cpp'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                          selectedLanguage === lang
                            ? 'bg-sky-600 dark:bg-green-600 text-white shadow-sky-300 dark:shadow-green-900/50'
                            : 'text-slate-700 dark:text-green-300 hover:text-slate-900 dark:hover:text-green-100 bg-white dark:bg-gray-800 hover:bg-sky-100 dark:hover:bg-green-900/50 border border-sky-200 dark:border-green-800'
                        }`}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={handleResetCode}
                      className="p-1.5 text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 hover:bg-sky-100 dark:hover:bg-green-900/50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Reset code"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-600 dark:bg-green-600 hover:bg-emerald-700 dark:hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <Play className="h-3 w-3" />
                      <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                    <button
                      onClick={handleRunAll}
                      disabled={isRunning || !problem?.testCases?.length}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-teal-600 dark:bg-green-600 hover:bg-teal-700 dark:hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span>{isRunning ? 'Running...' : 'Run All Tests'}</span>
                    </button>
                    
                    <button
                      onClick={handleSubmitCode}
                      disabled={isSubmitting}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-sky-600 dark:bg-green-600 hover:bg-sky-700 dark:hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
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
                  height="55vh"
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
                    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                    tabSize: editorTabSize,
                    insertSpaces: true,
                    bracketPairColorization: { enabled: true },
                    renderWhitespace: 'selection',
                    renderControlCharacters: false,
                  }}
                />
              </div>
              
              {/* Status Bar */}
              <div className="bg-gradient-to-r from-sky-100 to-slate-200 dark:from-green-950/60 dark:to-gray-900/80 px-4 py-2 text-xs text-slate-700 dark:text-green-300 border-t border-sky-200 dark:border-green-800 flex flex-col lg:flex-row lg:items-center justify-between space-y-1 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-sky-700 dark:text-green-200">{selectedLanguage.toUpperCase()}</span>
                  <span className="font-medium">{code.length} characters</span>
                </div>
                <span className="font-bold text-sky-700 dark:text-green-200">{getCurrentTime()}</span>
              </div>
            </div>

            {/* Test Results */}
            {(testResults.status !== 'idle' || isRunning || isSubmitting) && (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-sky-200 dark:border-green-800 shadow-xl shadow-sky-200/50 dark:shadow-green-900/40 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-100 to-slate-200 dark:from-green-950/60 dark:to-gray-900/80 px-4 py-3 border-b border-sky-200 dark:border-green-800">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-1 lg:space-y-0">
                    <h3 className="font-black text-slate-900 dark:text-green-100 text-sm">
                      {testResults.isSubmission ? 'Submission Results' : 'Test Results'}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-green-300">
                      <span><span className="font-bold">Runtime:</span> {formatRuntime(testResults.runtimeMs as any, (testResults as any).runtimeText as any)}</span>
                      <span><span className="font-bold">Memory:</span> {formatMemory(testResults.memoryKb as any, (testResults as any).memoryText as any)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {(isRunning || isSubmitting) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-sky-200 dark:border-green-800 border-t-sky-600 dark:border-t-green-400 mr-3"></div>
                      <span className="text-slate-700 dark:text-green-300 font-bold text-sm">
                        {isSubmitting ? 'Submitting solution...' : 'Running code...'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className={`p-4 rounded-xl border shadow-md ${
                        testResults.status === 'accepted' 
                          ? 'bg-gradient-to-r from-emerald-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-emerald-300 dark:border-green-700' 
                          : 'bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/50 dark:to-red-900/50 border-red-300 dark:border-red-700'
                      }`}>
                        <div className="flex items-center">
                          {testResults.status === 'accepted' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-green-400 mr-2 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-green-100">
                              {testResults.status === 'accepted' ? 'Solution Accepted!' : 'Solution Failed'}
                            </h4>
                            <p className="text-xs text-slate-700 dark:text-green-300 font-medium">
                              Tests passed: {testResults.testsPassed}/{testResults.totalTests}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Codecoin Reward */}
                      {testResults.earnedCodecoin && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-green-950/50 dark:to-green-900/50 border border-amber-300 dark:border-green-700 rounded-xl shadow-md">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 text-amber-600 dark:text-green-400 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-amber-800 dark:text-green-200">Codecoin Earned!</p>
                              <p className="text-xs text-amber-700 dark:text-green-300 font-medium">You've earned 1 Codecoin for solving this problem.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Display */}
                      {testResults.error && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/50 dark:to-red-900/50 border border-red-300 dark:border-red-700 rounded-xl p-4 shadow-md">
                          <p className="text-red-800 dark:text-red-300 text-sm font-bold mb-1">Error:</p>
                          <p className="text-red-700 dark:text-red-400 text-xs font-mono break-all bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">{testResults.error}</p>
                        </div>
                      )}

                      {/* Test Case Results */}
                      {testResults.results && testResults.results.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-black text-slate-900 dark:text-green-100 text-sm">Test Cases:</h4>
                          <div className="space-y-3 max-h-56 lg:max-h-64 overflow-y-auto pr-1">
                            {testResults.results.map((result: TestCaseResult, index: number) => {
                              const bgClass = result.passed 
                                ? 'bg-gradient-to-r from-emerald-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-emerald-300 dark:border-green-700' 
                                : 'bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/50 dark:to-red-900/50 border-red-300 dark:border-red-700';
                              const textClass = result.passed 
                                ? 'text-emerald-800 dark:text-green-200' 
                                : 'text-red-800 dark:text-red-200';
                              return (
                                <div key={index} className={`p-3 rounded-xl border shadow-sm ${bgClass}`}>
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 space-y-1 lg:space-y-0">
                                    <span className={`text-xs font-black ${textClass}`}>
                                      Test {index + 1} - {result.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                    {result.runtime && (
                                      <span className="text-xs text-slate-600 dark:text-green-300 font-bold">
                                        {result.runtime} ms
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <span className="text-sky-700 dark:text-green-300 font-bold text-xs">Input:</span>
                                      <div className="bg-sky-100 dark:bg-green-900/40 p-2 rounded-lg mt-1 border border-sky-200 dark:border-green-800">
                                        <code className="text-sky-800 dark:text-green-200 break-all font-mono text-xs">
                                          {JSON.stringify(result.input, null, 2)}
                                        </code>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <span className="text-sky-700 dark:text-green-300 font-bold text-xs">Expected:</span>
                                      <div className="bg-emerald-100 dark:bg-green-900/40 p-2 rounded-lg mt-1 border border-emerald-200 dark:border-green-800">
                                        <code className="text-emerald-800 dark:text-green-200 break-all font-mono text-xs">
                                          {JSON.stringify(result.expectedOutput, null, 2)}
                                        </code>
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-sky-700 dark:text-green-300 font-bold text-xs">Output:</span>
                                      <div className={`p-2 rounded-lg mt-1 border ${result.passed ? 'bg-emerald-100 dark:bg-green-900/40 border-emerald-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-700'}`}>
                                        <code className={`break-all font-mono text-xs ${result.passed ? 'text-emerald-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                          {JSON.stringify(result.actualOutput, null, 2)}
                                        </code>
                                      </div>
                                    </div>
                                    
                                    {!result.passed && result.error && (
                                      <div className="mt-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-2 rounded-lg border border-red-200 dark:border-red-700">
                                        <span className="font-bold">Error: </span>
                                        <span className="break-all font-mono text-xs">{result.error}</span>
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
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-sky-200 dark:border-green-800">
                        <div className="text-center bg-sky-50 dark:bg-green-900/30 rounded-lg p-2.5 border border-sky-200 dark:border-green-800">
                          <div className="text-base font-black text-slate-900 dark:text-green-100">
                            {testResults.testsPassed}/{testResults.totalTests}
                          </div>
                          <div className="text-xs text-sky-600 dark:text-green-300 font-bold">Tests Passed</div>
                        </div>
                        <div className="text-center bg-sky-50 dark:bg-green-900/30 rounded-lg p-2.5 border border-sky-200 dark:border-green-800">
                          <div className="text-base font-black text-slate-900 dark:text-green-100">
                            {testResults.runtimeMs ? `${testResults.runtimeMs}ms` : '--'}
                          </div>
                          <div className="text-xs text-sky-600 dark:text-green-300 font-bold">Runtime</div>
                        </div>
                        <div className="text-center bg-sky-50 dark:bg-green-900/30 rounded-lg p-2.5 border border-sky-200 dark:border-green-800">
                          <div className="text-base font-black text-slate-900 dark:text-green-100">
                            {testResults.memoryKb ? `${Math.round(testResults.memoryKb / 1024 * 10) / 10} MB` : '--'}
                          </div>
                          <div className="text-xs text-sky-600 dark:text-green-300 font-bold">Memory</div>
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
}

export default ProblemDetail;