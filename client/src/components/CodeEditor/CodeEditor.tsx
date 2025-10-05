import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { php } from "@codemirror/lang-php";
import { go } from "@codemirror/lang-go";
import { useParams } from "react-router-dom";

type Lang = "Java" | "Cpp" | "Python" | "JavaScript" | "CSharp" | "Ruby" | "Go" | "Rust" | "PHP" | "C";

const DEFAULT_SNIPPETS: Record<Lang, string> = {
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}`,
  Cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello C++" << endl;\n  return 0;\n}`,
  Python: `print('Hello Python')`,
  JavaScript: `console.log('Hello JavaScript');`,
  CSharp: `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello C#");\n  }\n}`,
  Ruby: `puts 'Hello Ruby'`,
  Go: `package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello Go")\n}`,
  Rust: `fn main() {\n  println!("Hello Rust");\n}`,
  PHP: `<?php\necho "Hello PHP\\n";\n?>`,
  C: `#include <stdio.h>\n\nint main() {\n  printf("Hello C\\n");\n  return 0;\n}`,
};

const CodeEditor = () => {
  const [lang, setLang] = useState<Lang>("JavaScript");
  const [code, setCode] = useState<string>(DEFAULT_SNIPPETS["JavaScript"]);
  const [codeByLang, setCodeByLang] = useState<Record<Lang, string>>({
    Java: DEFAULT_SNIPPETS.Java,
    Cpp: DEFAULT_SNIPPETS.Cpp,
    Python: DEFAULT_SNIPPETS.Python,
    JavaScript: DEFAULT_SNIPPETS.JavaScript,
    CSharp: DEFAULT_SNIPPETS.CSharp,
    Ruby: DEFAULT_SNIPPETS.Ruby,
    Go: DEFAULT_SNIPPETS.Go,
    Rust: DEFAULT_SNIPPETS.Rust,
    PHP: DEFAULT_SNIPPETS.PHP,
    C: DEFAULT_SNIPPETS.C,
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
  const [testcases, setTestcases] = useState<Array<{
    input: string;
    expected: string;
    output?: string;
    passed?: boolean;
    runtimeMs?: number;
    memoryKb?: number;
    exitCode?: number
  }>>([{ input: '', expected: '' }]);
  const [problemId, setProblemId] = useState<string | null>(null);
  const { id: routeProblemId } = useParams<{ id?: string }>();

  // API base URL - uses environment variable or defaults to localhost
  const apiBase = (() => {
    const env: any = (import.meta as any).env || {};
    let base = (env.VITE_COMPILER_API as string) || '';
    if (base && base.trim()) {
      base = base.trim().replace(/\/+$/, '');
      return base;
    }
    // Default to localhost:3000
    return 'http://localhost:3000';
  })();

  // Language to API mapping
  const langToApiLang = (l: Lang): string => {
    const map: Record<Lang, string> = {
      Java: 'java',
      Cpp: 'cpp',
      Python: 'python',
      JavaScript: 'javascript',
      CSharp: 'csharp',
      Ruby: 'ruby',
      Go: 'go',
      Rust: 'rust',
      PHP: 'php',
      C: 'c',
    };
    return map[l] || 'javascript';
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
      error: "text-red-600"
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
      error: "text-red-400"
    }
  };

  const theme = darkMode ? themeClasses.dark : themeClasses.light;

  // Load problem test cases if problem ID is in route
  useEffect(() => {
    const loadProblem = async () => {
      if (routeProblemId) {
        try {
          setProblemId(routeProblemId);
          const response = await fetch(`/api/problems/${routeProblemId}/testcases`);
          if (response.ok) {
            const data = await response.json();
            if (data.testCases && data.testCases.length > 0) {
              setTestcases(data.testCases.map((tc: any) => ({
                input: tc.input || '',
                expected: tc.expectedOutput || ''
              })));
            }
          }
        } catch (error) {
          console.error('Failed to load problem:', error);
        }
      }
    };
    loadProblem();
  }, [routeProblemId]);

  // Persist settings
  useEffect(() => {
    try {
      const savedDarkMode = localStorage.getItem('codeEditor:darkMode');
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('codeEditor:darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  // When language changes, show that language's buffer
  useEffect(() => {
    setCode(codeByLang[lang] ?? DEFAULT_SNIPPETS[lang]);
  }, [lang, codeByLang]);

  // Load saved code per language on mount
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
    try { localStorage.setItem(`codeEditor:code:${lang}`, code); } catch {}
  }, [code, lang]);

  const cmExtensions = () => {
    if (lang === "Cpp" || lang === "C") return [cpp()];
    if (lang === "Java") return [java()];
    if (lang === "Python") return [python()];
    if (lang === "JavaScript") return [javascript({ typescript: false })];
    if (lang === "Go") return [go()];
    if (lang === "Rust") return [rust()];
    if (lang === "PHP") return [php()];
    return [];
  };

  const normalize = (s: string) => {
    if (s === undefined || s === null) return '';
    let t = s;
    if (ignoreWhitespace) t = t.replace(/\s+/g, ' ').trim(); else t = t.trim();
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

      const payload = {
        code,
        language: langToApiLang(lang),
        input
      };

      const res = await fetch(`${apiBase}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`API Error ${res.status}: ${txt || res.statusText}`);
      }

      const data = await res.json();
      const outText = typeof data?.output === "string" ? data.output :
                      typeof data?.stdout === "string" ? data.stdout :
                      JSON.stringify(data);

      setOutput(outText);
      setStdoutText(typeof data?.stdout === 'string' ? data.stdout : outText);
      setStderrText(typeof data?.stderr === 'string' ? data.stderr : '');
      setCompilerLog(outText);
      setRuntimeMs(typeof data?.runtimeMs === 'number' ? data.runtimeMs : null);
      setMemoryKb(typeof data?.memoryKb === 'number' ? data.memoryKb : null);
      setExitCode(typeof data?.exitCode === 'number' ? data.exitCode : null);

      if (typeof data?.exitCode === 'number' && data.exitCode !== 0) {
        setShowLog(true);
      }

      // Check vs expected
      if (expected.trim().length > 0) {
        const ok = normalize(outText) === normalize(expected);
        setPassed(ok);
      }
    } catch (e: any) {
      const msg = e?.message || "Run failed";
      setOutput(msg);
      setCompilerLog(msg);
      setPassed(false);
      setShowLog(true);
    } finally {
      setRunning(false);
    }
  };

  const runAll = async () => {
    if (testcases.length === 0) return;

    setRunning(true);

    // Reset all test cases
    setTestcases(prev => prev.map(tc => ({
      ...tc,
      output: undefined,
      passed: undefined,
      runtimeMs: undefined,
      memoryKb: undefined,
      exitCode: undefined
    })));

    // Run each test case
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      const payload = {
        code,
        language: langToApiLang(lang),
        input: tc.input
      };

      try {
        const res = await fetch(`${apiBase}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`API Error ${res.status}`);
        }

        const data = await res.json();
        const output = typeof data?.output === "string" ? data.output :
                      typeof data?.stdout === "string" ? data.stdout :
                      JSON.stringify(data);
        const exitCode = typeof data?.exitCode === 'number' ? data.exitCode : null;
        const runtimeMs = typeof data?.runtimeMs === 'number' ? data.runtimeMs : undefined;
        const memoryKb = typeof data?.memoryKb === 'number' ? data.memoryKb : undefined;

        const normalizedOutput = normalize(output);
        const normalizedExpected = normalize(tc.expected);
        const passed = normalizedExpected ? normalizedOutput === normalizedExpected : null;

        setTestcases(prev => prev.map((item, idx) =>
          idx === i
            ? {
                ...item,
                output,
                passed: passed ?? undefined,
                runtimeMs,
                memoryKb,
                exitCode: exitCode ?? undefined
              }
            : item
        ));

        // Small delay between test cases
        if (i < testcases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error('Error running test case:', error);
        setTestcases(prev => prev.map((item, idx) =>
          idx === i
            ? {
                ...item,
                output: 'Error: Failed to run test case',
                passed: false,
                exitCode: -1
              }
            : item
        ));
      }
    }

    setRunning(false);
  };

  const resetTestcases = () => {
    if (confirm('Are you sure you want to reset all test cases?')) {
      setTestcases([{ input: '', expected: '' }]);
    }
  };

  const exportTestcases = () => {
    const data = {
      problemId,
      testcases: testcases.map(({ input, expected }) => ({ input, expected })),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = problemId ? `testcases-${problemId}.json` : 'testcases.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTestcases = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data.testcases)) {
          setTestcases(data.testcases);
        } else if (Array.isArray(data)) {
          setTestcases(data);
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        alert('Failed to import test cases. Invalid file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-xl ${theme.button.secondary} flex items-center gap-2 text-sm font-medium`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <select
            className={`px-4 py-2 rounded-xl ${theme.input} text-sm font-medium`}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="Cpp">C++</option>
            <option value="C">C</option>
            <option value="CSharp">C#</option>
            <option value="Ruby">Ruby</option>
            <option value="Go">Go</option>
            <option value="Rust">Rust</option>
            <option value="PHP">PHP</option>
          </select>

          <button
            onClick={run}
            disabled={running}
            className={`px-6 py-2 rounded-xl ${theme.button.success} flex items-center gap-2 text-sm font-semibold min-w-[100px] justify-center disabled:opacity-50`}
          >
            {running ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
            theme={darkMode ? 'dark' : 'light'}
            value={code}
            extensions={cmExtensions()}
            onChange={(val) => {
              setCode(val);
              setCodeByLang(prev => ({ ...prev, [lang]: val }));
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
                  <input
                    type="checkbox"
                    checked={ignoreWhitespace}
                    onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    className="rounded"
                  />
                  Ignore whitespace
                </label>
                <label className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={ignoreCase}
                    onChange={(e) => setIgnoreCase(e.target.checked)}
                    className="rounded"
                  />
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
              <textarea
                className={`w-full h-24 rounded-xl p-3 text-sm ${theme.input}`}
                value={output}
                readOnly
                placeholder="Output will appear here..."
              />

              {showLog && (
                <div className="mt-3">
                  <button
                    className={`text-xs px-3 py-1 rounded-lg ${theme.button.secondary}`}
                    onClick={() => setShowLog(!showLog)}
                  >
                    {showLog ? 'Hide' : 'Show'} Details
                  </button>
                  {showLog && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <div className={`text-xs font-semibold ${theme.text}`}>stdout</div>
                        <textarea
                          className={`w-full h-20 rounded p-2 text-xs ${theme.input}`}
                          readOnly
                          value={stdoutText}
                        />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${theme.text}`}>stderr</div>
                        <textarea
                          className={`w-full h-20 rounded p-2 text-xs ${theme.input}`}
                          readOnly
                          value={stderrText}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {passed !== null && (
                <div className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${passed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                  {passed ? '✅ Test Passed!' : '❌ Test Failed'}
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
            <button
              className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary}`}
              onClick={() => setTestcases(t => [...t, { input: '', expected: '' }])}
            >
              ➕ Add
            </button>
            <button
              className={`px-3 py-2 rounded-xl text-sm ${theme.button.danger}`}
              onClick={resetTestcases}
            >
              🗑️ Reset
            </button>
            <button
              className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary}`}
              onClick={exportTestcases}
            >
              📤 Export
            </button>
            <label className={`px-3 py-2 rounded-xl text-sm ${theme.button.primary} cursor-pointer`}>
              �� Import
              <input type="file" accept=".json" onChange={importTestcases} className="hidden" />
            </label>
            <button
              className={`px-3 py-2 rounded-xl text-sm ${theme.button.success} min-w-[100px] disabled:opacity-50`}
              onClick={runAll}
              disabled={running}
            >
              {running ? '⏳ Running...' : '🚀 Run All'}
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testcases.map((tc, idx) => (
            <div key={idx} className={`rounded-xl p-4 ${theme.testcase}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-bold ${theme.text}`}>Test #{idx + 1}</span>
                <button
                  className={`text-xs px-2 py-1 rounded ${theme.button.danger}`}
                  onClick={() => setTestcases(t => t.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className={`text-xs font-bold ${theme.text}`}>Input</label>
                  <textarea
                    className={`w-full h-20 rounded p-2 text-xs ${theme.input}`}
                    value={tc.input}
                    onChange={(e) => setTestcases(t => t.map((x, i) => i === idx ? { ...x, input: e.target.value } : x))}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold ${theme.text}`}>Expected</label>
                  <textarea
                    className={`w-full h-20 rounded p-2 text-xs ${theme.input}`}
                    value={tc.expected}
                    onChange={(e) => setTestcases(t => t.map((x, i) => i === idx ? { ...x, expected: e.target.value } : x))}
                  />
                </div>
              </div>

              {typeof tc.output === 'string' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-xs font-bold ${theme.text}`}>Output</label>
                    <div className={`text-xs ${theme.textMuted}`}>
                      {tc.runtimeMs != null && <span>⏱️{tc.runtimeMs}ms </span>}
                      {tc.exitCode != null && <span>Exit:{tc.exitCode}</span>}
                    </div>
                  </div>
                  <textarea
                    className={`w-full h-16 rounded p-2 text-xs ${theme.input}`}
                    readOnly
                    value={tc.output}
                  />
                  {typeof tc.passed !== 'undefined' && (
                    <div className={`mt-2 p-2 rounded text-xs font-bold ${tc.passed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                      {tc.passed ? '✅ Passed' : '❌ Failed'}
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
