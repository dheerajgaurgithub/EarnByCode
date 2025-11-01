import React, { useEffect, useState, ChangeEvent, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { useParams } from "react-router-dom";

type Lang =
  | "Java"
  | "Cpp"
  | "Python";

const DEFAULT_SNIPPETS: Record<Lang, string> = {
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}`,
  Cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello C++" << endl;\n  return 0;\n}`,
  Python: `print('Hello Python')`,
};

const CodeEditor: React.FC = () => {
  const [lang, setLang] = useState<Lang>("Java");
  const [code, setCode] = useState<string>(DEFAULT_SNIPPETS["Java"]);
  const [codeByLang, setCodeByLang] = useState<Record<Lang, string>>({
    Java: DEFAULT_SNIPPETS.Java,
    Cpp: DEFAULT_SNIPPETS.Cpp,
    Python: DEFAULT_SNIPPETS.Python,
  });
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [expected, setExpected] = useState<string>("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null);
  const [memoryKb, setMemoryKb] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [compilerLog, setCompilerLog] = useState<string>("");
  const [showLog, setShowLog] = useState<boolean>(false);
  const [stdoutText, setStdoutText] = useState<string>("");
  const [stderrText, setStderrText] = useState<string>("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedTcIndex, setSelectedTcIndex] = useState<number>(0);
  // Stores details about the last executor attempts (endpoints/payloads)
  const lastExecMetaRef = useRef<string>("");
  const [testcases, setTestcases] = useState<
    Array<{
      input: string;
      expected: string;
      output?: string;
      passed?: boolean;
      runtimeMs?: number;
      memoryKb?: number;
      exitCode?: number;
    }>
  >([{ input: "", expected: "" }]);
  const [problemId, setProblemId] = useState<string | null>(null);
  const { id: routeProblemId } = useParams<{ id?: string }>();

  // API base URL - uses environment variable or defaults to localhost
  const apiBase = (() => {
    const env: any = (import.meta as any).env || {};
    let base = (env.VITE_COMPILER_API as string) || "";
    if (base && base.trim()) {
      base = base.trim().replace(/\/+$/, "");
      return base;
    }
    // Default to localhost:3000
    return "http://localhost:3000";
  })();

  // Judge0 API configuration (primary compiler)
  const judge0Base = (() => {
    const env: any = (import.meta as any).env || {};
    const override = env.VITE_JUDGE0_API as string | undefined;
    
    if (override && override.trim()) {
      let base = override.trim();
      base = base.replace(/\/+$/, '');
      return base;
    }
    
    // Default to Judge0 public API via RapidAPI
    return 'https://judge0-ce.p.rapidapi.com';
  })();
  
  // Get RapidAPI key for Judge0
  const judge0ApiKey = (() => {
    const env: any = (import.meta as any).env || {};
    return env.VITE_RAPIDAPI_KEY as string | undefined || '';
  })();

  // Main App API (problems) base URL
  const getApiBase = () => {
    const raw = (import.meta as any).env?.VITE_API_URL as string | undefined;
    let base = raw && raw.trim() ? raw.trim() : "https://earnbycode-mfs3.onrender.com/api";
    base = base.replace(/\/+$/, "");
    if (!/\/api$/.test(base)) base = `${base}/api`;
    return base;
  };

  // Optional executor backend mode (e.g., 'judge0')
  const backendMode = (() => {
    const env: any = (import.meta as any).env || {};
    const m = (env.VITE_COMPILER_BACKEND as string) || '';
    return (m || '').toLowerCase();
  })();

  // Language to API mapping
  const langToApiLang = (l: Lang): string => {
    const map: Record<Lang, string> = {
      Java: "java",
      Cpp: "cpp",
      Python: "python",
    };
    return map[l] || "java";
  };

  // Judge0 language_id mapping (common defaults). Adjust if your instance differs.
  const judge0LanguageId = (l: Lang): number => {
    // Defaults for Java, C++, Python only
    const ids: Record<Lang, number> = {
      Java: 62,        // Java (OpenJDK 17)
      Cpp: 54,         // C++ (GCC 9.2.0)
      Python: 71,      // Python (3.8.1)
    };
    // Optional overrides via env JSON: VITE_JUDGE0_LANG_IDS
    try {
      const raw = (import.meta as any).env?.VITE_JUDGE0_LANG_IDS as string | undefined;
      if (raw && raw.trim()) {
        const map = JSON.parse(raw);
        if (map && typeof map === 'object') {
          // Allow keys by our Lang labels or lowercased names
          const byKey = (key: string) => (typeof map[key] === 'number' ? map[key] : undefined);
          const alt = byKey(l) ?? byKey(l.toLowerCase());
          if (typeof alt === 'number') return alt;
        }
      }
    } catch {}
    return ids[l] ?? 62;
  };

  // Build piston-style payload with explicit filename per language
  const buildPistonPayload = (l: Lang, src: string, stdin?: string) => {
    const lower = langToApiLang(l);
    const filename = (() => {
      switch (l) {
        case "Java":
          return /\bclass\s+Solution\b/.test(src) ? "Solution.java" : "Main.java";
        case "Cpp":
          return "main.cpp";
        case "Python":
          return "main.py";
        default:
          return "main.txt";
      }
    })();
    const payload: any = {
      language: lower,
      version: "*",
      files: [{ name: filename, content: src }],
    };
    if (typeof stdin === "string") payload.stdin = stdin;
    return payload;
  };

  // Strong compilation using Judge0 online compiler (primary method)
  const executeWithJudge0 = async (src: string, l: Lang, stdin?: string) => {
    console.log(`🚀 Starting Judge0 execution for ${l} with ${stdin?.length || 0} chars of input`);

    try {
      // Build Judge0 API payload
      const payload = {
        source_code: src,
        language_id: judge0LanguageId(l),
        stdin: stdin ?? "",
        cpu_time_limit: 2,
        memory_limit: 128000,
      };

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add RapidAPI authentication if using public Judge0
      if (judge0ApiKey && judge0Base.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = judge0ApiKey;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      }

      console.log(`📡 Calling Judge0 API at ${judge0Base}`);

      const res = await fetch(`${judge0Base}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error(`❌ Judge0 API failed (${res.status}): ${txt}`);
        
        // Provide helpful error messages
        if (res.status === 401) {
          throw new Error(`🔑 Judge0 API Authentication Failed. Please set VITE_RAPIDAPI_KEY in your .env file. See JUDGE0_SETUP.md for instructions.`);
        }
        if (res.status === 429) {
          throw new Error(`⏱️ Rate limit exceeded. You've used all your free Judge0 requests for today. Please wait 24 hours or upgrade your plan.`);
        }
        if (res.status === 503) {
          throw new Error(`🔧 Judge0 service temporarily unavailable. Please try again in a few moments.`);
        }
        
        throw new Error(`Judge0 API Error (${res.status}): ${txt}`);
      }

      const data = await res.json();
      console.log(`✅ Judge0 execution succeeded for ${l}`);

      // Parse Judge0 response format
      const statusId = data?.status?.id;
      const stdout = (data?.stdout ?? "").toString();
      const stderr = (data?.stderr ?? data?.compile_output ?? "").toString();
      const time = data?.time ? Math.round(parseFloat(data.time) * 1000) : undefined;
      const memory = data?.memory ? Math.round(data.memory) : undefined;

      // Status codes: 3=Accepted, 4=Wrong Answer, 5=Time Limit, 6=Compilation Error
      const exitCode = statusId === 3 ? 0 : (statusId ?? 1);

      // Enhanced result validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from Judge0');
      }

      return {
        stdout,
        stderr,
        output: stdout,
        exitCode,
        runtimeMs: time,
        memoryKb: memory,
        executionSource: 'judge0',
        executionMethod: 'judge0',
        status: data?.status,
      };
    } catch (error: any) {
      console.error(`💥 Judge0 execution failed:`, error.message);
      throw error;
    }
  };

  // Theme classes
  const themeClasses = {
    light: {
      container: "bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen",
      panel: "bg-white border border-blue-200 shadow-lg",
      header: "bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200",
      text: "text-gray-900",
      textSecondary: "text-gray-700",
      textMuted: "text-gray-600",
      input: "bg-white border border-blue-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
      },
      testcase: "bg-blue-50 border border-blue-200",
      success: "text-green-600",
      error: "text-red-600",
    },
    dark: {
      container: "bg-gradient-to-br from-gray-900 to-slate-900 min-h-screen",
      panel: "bg-slate-800 border border-slate-700 shadow-xl",
      header: "bg-gradient-to-r from-slate-900 to-gray-900 border-b border-slate-700",
      text: "text-slate-100",
      textSecondary: "text-slate-300",
      textMuted: "text-slate-400",
      input: "bg-slate-700 border border-slate-600 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-400",
      button: {
        primary: "bg-blue-700 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600",
        danger: "bg-red-600 hover:bg-red-500 text-white shadow-md hover:shadow-lg transition-all duration-200",
        success: "bg-green-700 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
      },
      testcase: "bg-slate-700 border border-slate-600",
      success: "text-green-400",
      error: "text-red-400",
    },
  };

  const theme = darkMode ? themeClasses.dark : themeClasses.light;

  // Load problem test cases if problem ID is in route (from App API, not compiler API)
  useEffect(() => {
    const loadProblem = async () => {
      if (routeProblemId) {
        try {
          setProblemId(routeProblemId);
          const url = `${getApiBase()}/problems/${routeProblemId}/testcases`;
          const response = await fetch(url);
          if (response.ok) {
            const raw = await response.json();
            const arr: any[] = Array.isArray(raw)
              ? raw
              : Array.isArray(raw?.testcases)
              ? raw.testcases
              : Array.isArray(raw?.testCases)
              ? raw.testCases
              : [];
            const visible = arr
              .filter((t: any) => {
                const hidden =
                  t?.hidden || t?.isHidden || t?.visibility === "hidden" || t?.private === true;
                return !hidden;
              })
              .map((t: any) => ({
                input: String(t?.input ?? ""),
                expected: String(
                  t?.expectedOutput ??
                    t?.expected ??
                    t?.expected_output ??
                    t?.outputExpected ??
                    t?.output ??
                    ""
                ),
              }));
            if (visible.length > 0) setTestcases(visible);
          }
        } catch (error) {
          console.error("Failed to load problem:", error);
        }
      }
    };
    loadProblem();
    // We intentionally don't include getApiBase in deps (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProblemId]);

  // Persist settings
  useEffect(() => {
    try {
      const savedDarkMode = localStorage.getItem("codeEditor:darkMode");
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("codeEditor:darkMode", String(darkMode));
    } catch {}
  }, [darkMode]);

  // When language changes, show that language's buffer
  useEffect(() => {
    setCode(codeByLang[lang] ?? DEFAULT_SNIPPETS[lang]);
  }, [lang, codeByLang]);

  // Load saved code per language on mount/when lang changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`codeEditor:code:${lang}`);
      if (stored !== null) {
        setCode(stored);
        setCodeByLang((prev) => ({ ...prev, [lang]: stored }));
      }
    } catch {}
  }, [lang]);

  // Persist code per language
  useEffect(() => {
    try {
      localStorage.setItem(`codeEditor:code:${lang}`, code);
    } catch {}
  }, [code, lang]);

  const cmExtensions = () => {
    if (lang === "Cpp") return [cpp()];
    if (lang === "Java") return [java()];
    if (lang === "Python") return [python()];
    return [];
  };

  const normalize = (s: string) => {
    if (s === undefined || s === null) return "";
    let t = s;
    if (ignoreWhitespace) t = t.replace(/\s+/g, " ").trim();
    else t = t.trim();
    if (ignoreCase) t = t.toLowerCase();
    return t;
  };

  const run = async () => {
    try {
      setRunning(true);
      setOutput("");
      setPassed(null);
      setRuntimeMs(null);
      setMemoryKb(null);
      setExitCode(null);
      setStdoutText("");
      setStderrText("");
      setCompilerLog("");
      setShowLog(false);

      console.log(`🔧 Starting code execution for ${lang}`);

      // Enhanced code validation
      if (!code || code.trim().length === 0) {
        throw new Error("❌ Please enter some code before running");
      }

      // Language-specific validation
      if (lang === "Java" && !code.includes("class")) {
        throw new Error("❌ Java code must include a class definition");
      }
      if (lang === "Cpp" && !code.includes("main(")) {
        throw new Error("❌ C++ code must include a main function");
      }
      if (lang === "Python" && !code.includes("def ") && !code.includes("print") && !code.includes("input")) {
        throw new Error("❌ Python code must include a function definition or print/input statements");
      }

      // Prefer first problem testcase when available
      const hasProblemTests = problemId && Array.isArray(testcases) && testcases.length > 0;
      const idx = hasProblemTests ? Math.max(0, Math.min(selectedTcIndex, testcases.length - 1)) : -1;
      const tc0 = idx >= 0 ? testcases[idx] : null;
      const effectiveInput = tc0 ? tc0.input : input;
      const effectiveExpected = tc0 ? tc0.expected : expected;

      console.log(`📝 Running with input: ${effectiveInput?.substring(0, 50)}${effectiveInput?.length > 50 ? '...' : ''}`);

      const data = await executeWithJudge0(code, lang, effectiveInput);

      // Check for compilation errors (Judge0 status 6)
      if (data?.status?.id === 6) {
        const compileError = data?.stderr || 'Compilation failed';
        throw new Error(`🔨 Compilation Error:\n${compileError}`);
      }

      // Check for runtime errors (Judge0 status 5, 7-14)
      const statusId = data?.status?.id;
      if (statusId && statusId !== 3 && statusId >= 4) {
        const statusDesc = data?.status?.description || 'Runtime error';
        console.warn(`⚠️ Execution status: ${statusDesc}`);
      }

      const outText = data?.stdout || data?.output || "";
      const errText = data?.stderr || "";

      setOutput(outText);
      setStdoutText(outText);
      setStderrText(errText);

      // Enhanced logging with execution details
      const executionDetails = [
        `🔧 Language: ${lang}`,
        `📡 Execution Source: Judge0 Online Compiler`,
        `✅ Status: ${data?.status?.description || 'Success'}`,
        `⏱️ Runtime: ${data.runtimeMs || '0'}ms`,
        `💾 Memory: ${data.memoryKb || '0'}KB`,
        `📊 Exit Code: ${data.exitCode ?? 0}`,
        outText ? `📤 Output: ${outText.substring(0, 300)}${outText.length > 300 ? '...' : ''}` : '📤 No output',
        errText ? `⚠️ Stderr: ${errText.substring(0, 200)}` : ''
      ].filter(Boolean).join('\n');

      setCompilerLog(executionDetails);

      // Sync right-hand inputs with the testcase we ran, for visibility
      if (tc0) {
        setInput(tc0.input);
        setExpected(tc0.expected);
      }
      setRuntimeMs(typeof data?.runtimeMs === "number" ? data.runtimeMs : null);
      setMemoryKb(typeof data?.memoryKb === "number" ? data.memoryKb : null);
      setExitCode(typeof data?.exitCode === "number" ? data.exitCode : null);

      if (typeof data?.exitCode === "number" && data.exitCode !== 0) {
        setShowLog(true);
        console.warn(`⚠️ Non-zero exit code: ${data.exitCode}`);
      }

      // Enhanced test case validation
      if (effectiveExpected.trim().length > 0) {
        const ok = normalize(outText) === normalize(effectiveExpected);
        setPassed(ok);

        if (ok) {
          console.log(`✅ Test PASSED - Output matches expected`);
        } else {
          console.log(`❌ Test FAILED - Expected: "${normalize(effectiveExpected)}", Got: "${normalize(outText)}"`);
          setShowLog(true);
        }
      } else {
        console.log(`ℹ️ No expected output to compare against`);
      }

    } catch (e: any) {
      console.error(`💥 Execution failed:`, e.message);
      const msg = e?.message || "❌ Run failed - Please check your code and try again";
      
      // Show user-friendly error messages
      setOutput(msg);
      
      let detailedLog = `${msg}\n\n`;
      
      // Add helpful tips based on error type
      if (msg.includes('Authentication Failed')) {
        detailedLog += `💡 Quick Fix:\n1. Create a .env file in the client folder\n2. Add: VITE_RAPIDAPI_KEY=your_key_here\n3. Get free key from: https://rapidapi.com/judge0-official/api/judge0-ce\n\n`;
      } else if (msg.includes('Rate limit')) {
        detailedLog += `💡 Solutions:\n1. Wait 24 hours for reset (free tier)\n2. Upgrade RapidAPI plan\n3. Self-host Judge0 (unlimited)\n\n`;
      } else if (msg.includes('Compilation Error')) {
        detailedLog += `💡 Check for:\n1. Syntax errors\n2. Missing semicolons\n3. Undefined variables\n4. Wrong class/function names\n\n`;
      }
      
      detailedLog += `🔍 Debug Info:\n${e.stack || 'No additional details'}\n`;
      detailedLog += `\n📚 Need help? Check JUDGE0_SETUP.md for setup instructions.`;
      
      setCompilerLog(detailedLog);
      setPassed(false);
      setShowLog(true);
    } finally {
      setRunning(false);
    }
  };

  const [stopOnFail, setStopOnFail] = useState<boolean>(false);
  const runAll = async () => {
    if (testcases.length === 0) {
      console.warn("⚠️ No test cases to run");
      return;
    }

    console.log(`🚀 Starting batch execution of ${testcases.length} test cases`);
    setRunning(true);

    // Reset all test cases
    setTestcases((prev) =>
      prev.map((tc) => ({
        ...tc,
        output: undefined,
        passed: undefined,
        runtimeMs: undefined,
        memoryKb: undefined,
        exitCode: undefined,
      }))
    );

    // Run each test case sequentially with enhanced error handling
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      console.log(`🔄 Running test case ${i + 1}/${testcases.length}`);

      try {
        const data = await executeWithJudge0(code, lang, tc.input);

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid execution response from Judge0');
        }

        // Parse Judge0 response
        const outputText = data?.stdout || data?.output || "";
        const stderr = data?.stderr || "";
        const exit = data?.exitCode ?? null;
        const runtime = data?.runtimeMs;
        const memory = data?.memoryKb;
        
        // Check for compilation errors
        if (data?.status?.id === 6) {
          throw new Error(`Compilation Error: ${stderr || 'Unknown compilation error'}`);
        }

        const normalizedOutput = normalize(outputText);
        const normalizedExpected = normalize(tc.expected);
        const passedResult = normalizedExpected ? normalizedOutput === normalizedExpected : null;

        setTestcases((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  output: outputText,
                  passed: passedResult ?? undefined,
                  runtimeMs: runtime,
                  memoryKb: memory,
                  exitCode: exit ?? undefined,
                }
              : item
          )
        );

        if (passedResult === false) {
          console.log(`❌ Test case ${i + 1} FAILED`);
          if (stopOnFail) {
            console.log(`🛑 Stopping execution due to failure`);
            break;
          }
        } else if (passedResult === true) {
          console.log(`✅ Test case ${i + 1} PASSED`);
        }

        // Increased delay between test cases for better reliability
        if (i < testcases.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`❌ Error running test case ${i + 1}:`, error.message);
        setTestcases((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  output: `❌ Execution Error: ${error.message}`,
                  passed: false,
                  exitCode: -1,
                }
              : item
          )
        );

        if (stopOnFail) {
          console.log(`🛑 Stopping execution due to error`);
          break;
        }
      }
    }

    console.log(`📊 Batch execution completed`);
    setRunning(false);
  };

  const resetTestcases = () => {
    // `confirm` is available in browser env
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to reset all test cases?")) {
      setTestcases([{ input: "", expected: "" }]);
    }
  };

  const exportTestcases = () => {
    const data = {
      problemId,
      testcases: testcases.map(({ input: tcIn, expected: tcExp }) => ({ input: tcIn, expected: tcExp })),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = problemId ? `testcases-${problemId}.json` : "testcases.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTestcases = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (Array.isArray(data.testcases)) {
          setTestcases(data.testcases);
        } else if (Array.isArray(data)) {
          setTestcases(data);
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        // alert is fine in this editor context
        // eslint-disable-next-line no-alert
        alert("Failed to import test cases. Invalid file format.");
      }
    };
    reader.readAsText(file);
    // clear the input so same file can be selected again if needed
    event.target.value = "";
  };

  return (
    <div className={`min-h-screen p-3 md:p-6 ${theme.container} transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 p-4 md:p-6 rounded-2xl ${theme.header} shadow-lg`}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">{'</>'}</span>
          </div>
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Code Compiler</h1>
            {problemId && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
                Problem: {problemId}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Testcase picker */}
          <div className="flex items-center gap-2">
            <label className={`text-xs ${theme.textMuted}`}>Testcase</label>
            <select
              className={`px-2 py-1 rounded ${theme.input} text-xs`}
              value={selectedTcIndex}
              onChange={(e) => setSelectedTcIndex(Number(e.target.value))}
            >
              {testcases.map((_, i) => (
                <option key={i} value={i}>{`#${i + 1}`}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-xl ${theme.button.secondary} flex items-center gap-2 text-sm font-medium`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <select
            className={`px-4 py-2 rounded-xl ${theme.input} text-sm font-medium`}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            <option value="Java">Java</option>
            <option value="Cpp">C++</option>
            <option value="Python">Python</option>
          </select>

          <button
            onClick={run}
            disabled={running}
            className={`px-6 py-2 rounded-xl ${theme.button.success} flex items-center gap-2 text-sm font-semibold min-w-[100px] justify-center disabled:opacity-50`}
          >
            {running ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Run
              </>
            ) : (
              <>▶️ Run</>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Code Editor */}
        <div className={`rounded-2xl overflow-hidden ${theme.panel}`}>
          <div className={`p-4 ${theme.header}`}>
            <h3 className={`font-bold text-lg ${theme.text}`}>Code Editor</h3>
          </div>
          <CodeMirror
            height="500px"
            theme={darkMode ? "dark" : "light"}
            value={code}
            extensions={cmExtensions()}
            onChange={(val) => {
              setCode(val);
              setCodeByLang((prev) => ({ ...prev, [lang]: val }));
            }}
          />
        </div>

        {/* Input/Output */}
        <div className={`rounded-2xl ${theme.panel}`}>
          <div className={`p-4 ${theme.header}`}>
            <h3 className={`font-bold text-lg ${theme.text}`}>Input & Output</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${theme.text}`}>Input</label>
              <textarea
                className={`w-full h-32 rounded-xl p-3 text-sm ${theme.input}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input..."
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${theme.text}`}>Expected Output</label>
              <textarea
                className={`w-full h-24 rounded-xl p-3 text-sm ${theme.input}`}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Expected output..."
              />
              <div className="flex gap-4 mt-2">
                <label className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} className="rounded" />
                  Ignore whitespace
                </label>
                <label className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className="rounded" />
                  Ignore case
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-semibold ${theme.text}`}>Output</label>
                <div className={`text-xs ${theme.textMuted} flex gap-2`}>
                  {runtimeMs != null && <span>⏱️ {runtimeMs}ms</span>}
                  {memoryKb != null && <span>💾 {memoryKb}KB</span>}
                  {exitCode != null && <span>Exit: {exitCode}</span>}
                </div>
              </div>
              <textarea className={`w-full h-24 rounded-xl p-3 text-sm ${theme.input}`} value={output} readOnly placeholder="Output will appear here..." />

              {showLog && (
                <div className="mt-3">
                  <button className={`text-xs px-3 py-1 rounded-lg ${theme.button.secondary}`} onClick={() => setShowLog(!showLog)}>
                    {showLog ? "Hide" : "Show"} Details
                  </button>
                  {showLog && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <div className={`text-xs font-semibold ${theme.text}`}>stdout</div>
                        <textarea className={`w-full h-20 rounded p-2 text-xs ${theme.input}`} readOnly value={stdoutText} />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${theme.text}`}>stderr</div>
                        <textarea className={`w-full h-20 rounded p-2 text-xs ${theme.input}`} readOnly value={stderrText} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {passed !== null && (
                <div
                  className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${
                    passed
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {passed ? "✅ Test Passed!" : "❌ Test Failed"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className={`rounded-2xl ${theme.panel}`}>
        <div className={`p-4 ${theme.header} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.text}`}>Test Cases</h3>
          <div className="flex gap-2">
            <button className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary}`} onClick={() => setTestcases((t) => [...t, { input: "", expected: "" }])}>
              ➕ Add
            </button>
            <button className={`px-3 py-2 rounded-xl text-sm ${theme.button.danger}`} onClick={resetTestcases}>
              🗑️ Reset
            </button>
            <button className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary}`} onClick={exportTestcases}>
              📤 Export
            </button>
            <label className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary} cursor-pointer`}>
              📥 Import
              <input type="file" accept=".json" onChange={importTestcases} className="hidden" />
            </label>
            <label className={`px-3 py-2 rounded-xl text-sm ${theme.button.secondary} flex items-center gap-2`}>
              <input type="checkbox" checked={stopOnFail} onChange={(e) => setStopOnFail(e.target.checked)} className="rounded" />
              Stop on first fail
            </label>
            <button className={`px-3 py-2 rounded-xl text-sm ${theme.button.success} min-w-[100px] disabled:opacity-50`} onClick={runAll} disabled={running}>
              {running ? "⏳ Running..." : "🚀 Run All"}
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testcases.map((tc, idx) => (
            <div key={idx} className={`rounded-xl p-4 ${theme.testcase}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-bold ${theme.text}`}>Test #{idx + 1}</span>
                <button className={`text-xs px-2 py-1 rounded ${theme.button.danger}`} onClick={() => setTestcases((t) => t.filter((_, i) => i !== idx))}>
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className={`text-xs font-bold ${theme.text}`}>Input</label>
                  <textarea className={`w-full h-20 rounded p-2 text-xs ${theme.input}`} value={tc.input} onChange={(e) => setTestcases((t) => t.map((x, i) => (i === idx ? { ...x, input: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={`text-xs font-bold ${theme.text}`}>Expected</label>
                  <textarea className={`w-full h-20 rounded p-2 text-xs ${theme.input}`} value={tc.expected} onChange={(e) => setTestcases((t) => t.map((x, i) => (i === idx ? { ...x, expected: e.target.value } : x)))} />
                </div>
              </div>

              {typeof tc.output === "string" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-xs font-bold ${theme.text}`}>Output</label>
                    <div className={`text-xs ${theme.textMuted}`}>
                      {tc.runtimeMs != null && <span>⏱️{tc.runtimeMs}ms </span>}
                      {tc.exitCode != null && <span>Exit:{tc.exitCode}</span>}
                    </div>
                  </div>
                  <textarea className={`w-full h-16 rounded p-2 text-xs ${theme.input}`} readOnly value={tc.output} />
                  {typeof tc.passed !== "undefined" && (
                    <div className={`mt-2 p-2 rounded text-xs font-bold ${tc.passed ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                      {tc.passed ? "✅ Passed" : "❌ Failed"}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;