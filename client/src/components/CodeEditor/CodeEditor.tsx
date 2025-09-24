import { useEffect, useRef, useState } from "react";
import { Editor, OnMount } from "@monaco-editor/react";
import { useParams } from "react-router-dom";

type Lang = "Java" | "Cpp" | "Python" | "JavaScript";

const DEFAULT_SNIPPETS: Record<Lang, string> = {
  Java: `public class Main {\n  public static void main(String[] args){\n    System.out.println(\"Hello Java\");\n  }\n}`,
  Cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello Cpp\\n\";\n  return 0;\n}`,
  Python: `print('Hello Python')`,
  JavaScript: `console.log('Hello JavaScript');`,
};

const CodeEditor = () => {
  const editorRef = useRef<any>(null);
  const [lang, setLang] = useState<Lang>("Cpp");
  const [code, setCode] = useState<string>(DEFAULT_SNIPPETS["Cpp"]);
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [expected, setExpected] = useState<string>("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [testcases, setTestcases] = useState<Array<{ input: string; expected: string; output?: string; passed?: boolean; runtimeMs?: number; exitCode?: number }>>([
    { input: '', expected: '' },
  ]);
  const [problemId, setProblemId] = useState<string | null>(null);
  const { id: routeProblemId } = useParams<{ id?: string }>();

  const apiBase = (() => {
    const env: any = (import.meta as any).env || {};
    // In production, call same-origin '/compile' so backend-integrated route works after deploy
    if (env.PROD) return '';
    // In dev, prefer VITE_COMPILER_API, else localhost:8000 (standalone dev server)
    return env.VITE_COMPILER_API || 'http://localhost:8000';
  })();

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // Theme classes
  const themeClasses = {
    light: {
      container: "bg-blue-50 min-h-screen",
      panel: "bg-white border border-blue-200 shadow-lg",
      header: "bg-blue-100 border-b border-blue-200",
      text: "text-blue-900",
      textSecondary: "text-blue-700",
      textMuted: "text-blue-600",
      input: "bg-white border border-blue-300 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
        secondary: "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        purple: "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
        indigo: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
      },
      testcase: "bg-blue-50 border border-blue-200",
      success: "text-green-600",
      error: "text-red-600"
    },
    dark: {
      container: "bg-gray-900 min-h-screen",
      panel: "bg-slate-800 border border-slate-600",
      header: "bg-slate-900 border-b border-slate-600",
      text: "text-slate-100",
      textSecondary: "text-slate-300",
      textMuted: "text-slate-400",
      input: "bg-slate-700 border border-slate-600 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-400",
      button: {
        primary: "bg-blue-700 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600",
        danger: "bg-red-600 hover:bg-red-500 text-white shadow-md hover:shadow-lg transition-all duration-200",
        success: "bg-green-700 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        warning: "bg-yellow-600 hover:bg-yellow-500 text-white shadow-md hover:shadow-lg transition-all duration-200",
        purple: "bg-purple-700 hover:bg-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        indigo: "bg-indigo-700 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        emerald: "bg-emerald-700 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
          // Replace with your actual API endpoint
          const response = await fetch(`/api/problems/${routeProblemId}/testcases`);
          if (response.ok) {
            const data = await response.json();
            if (data.testCases && data.testCases.length > 0) {
              setTestcases(data.testCases.map((tc: any) => ({
                input: tc.input || '',
                expected: tc.expectedOutput || ''
              })));
              return;
            }
          }
          // If no test cases found, add one empty test case
          setTestcases([{ input: '', expected: '' }]);
        } catch (error) {
          console.error('Failed to load problem:', error);
          setTestcases([{ input: '', expected: '' }]);
        }
      }
    };
    
    loadProblem();
  }, [routeProblemId]);

  useEffect(() => {
    setCode((prev) => {
      // if user hasn't typed anything custom yet, use template on language switch
      if (!prev || prev === DEFAULT_SNIPPETS.Java || prev === DEFAULT_SNIPPETS.Cpp || prev === DEFAULT_SNIPPETS.Python || prev === DEFAULT_SNIPPETS.JavaScript) {
        return DEFAULT_SNIPPETS[lang];
      }
      return prev;
    });
  }, [lang]);

  const monacoLanguage =
    lang === "Cpp" ? "cpp" : lang === "JavaScript" ? "javascript" : lang.toLowerCase();

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
      const payload = { code, input, lang };
      const res = await fetch(`${apiBase}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setOutput(typeof data?.output === "string" ? data.output : JSON.stringify(data));
      setRuntimeMs(typeof data?.runtimeMs === 'number' ? data.runtimeMs : null);
      setExitCode(typeof data?.exitCode === 'number' ? data.exitCode : null);
      
      // Auto check vs expected (trim both)
      if (expected.trim().length > 0) {
        const ok = normalize((data?.output ?? "").toString()) === normalize(expected);
        setPassed(ok);
      } else {
        setPassed(null);
      }
    } catch (e: any) {
      setOutput(e?.message || "Run failed");
      setRuntimeMs(null);
      setExitCode(null);
      setPassed(false);
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
      exitCode: undefined
    })));
    
    // Run each test case one by one
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      const payload = {
        code,
        lang, // Fixed: was 'language', should be 'lang'
        input: tc.input
      };
      
      try {
        const startTime = performance.now();
        const res = await fetch(`${apiBase}/compile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const endTime = performance.now();
        const runtimeMs = Math.round(endTime - startTime);
        
        const data = await res.json();
        const output = typeof data?.output === "string" ? data.output : JSON.stringify(data);
        const exitCode = typeof data?.exitCode === 'number' ? data.exitCode : null;
        
        // Check if output matches expected
        const normalizedOutput = normalize(output);
        const normalizedExpected = normalize(tc.expected);
        const passed = normalizedExpected ? normalizedOutput === normalizedExpected : null;
        
        // Update the specific test case with results
        setTestcases(prev => prev.map((item, idx) => 
          idx === i 
            ? { 
                ...item, 
                output,
                passed: passed ?? undefined,
                runtimeMs,
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
    if (confirm('Are you sure you want to reset all test cases? This cannot be undone.')) {
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
          throw new Error('Invalid test cases format');
        }
      } catch (error) {
        alert('Failed to import test cases. Invalid file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    // Reset the input to allow re-uploading the same file
    event.target.value = '';
  };

  return (
    <div className={`min-h-screen p-3 md:p-6 ${theme.container} transition-all duration-300`}>
      {/* Header with theme toggle */}
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 p-4 md:p-6 rounded-2xl ${theme.header} shadow-lg backdrop-blur-sm border border-sky-100 dark:border-gray-700`}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-sm md:text-lg font-bold">{'</>'}</span>
          </div>
          <div>
            <h1 className={`text-lg md:text-2xl font-bold ${theme.text} leading-tight`}>Code Editor</h1>
            {problemId && (
              <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-gray-700 dark:text-sky-300 font-medium mt-1 inline-block`}>
                Problem: {problemId}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 md:px-4 py-2 md:py-3 rounded-xl ${theme.button.secondary} flex items-center justify-center gap-2 text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md`}
          >
            <span className="text-base md:text-lg">{darkMode ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          
          {/* Language Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className={`text-xs md:text-sm font-semibold ${theme.text}`}>Language:</label>
            <select
              className={`px-3 md:px-4 py-2 md:py-3 rounded-xl ${theme.input} text-xs md:text-sm font-medium min-w-0 sm:min-w-[120px] shadow-sm border-0 focus:ring-2 focus:ring-sky-400`}
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="Java">Java</option>
              <option value="Cpp">C++</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
            </select>
          </div>
          
          {/* Run Button */}
          <button
            type="button"
            onClick={run}
            disabled={running}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl disabled:opacity-60 ${theme.button.success} flex items-center justify-center gap-2 text-xs md:text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg min-w-[100px] md:min-w-[120px]`}
          >
            {running ? (
              <>
                <div className="animate-spin w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="hidden sm:inline">Running...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <span className="text-sm md:text-base">▶️</span>
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Editor and IO Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Code Editor */}
        <div className={`rounded-2xl overflow-hidden ${theme.panel} shadow-xl border border-sky-100 dark:border-gray-700`}>
          <div className={`p-3 md:p-4 ${theme.header} border-b border-sky-100 dark:border-gray-600`}>
            <h3 className={`font-bold text-sm md:text-lg ${theme.text} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Code Editor
            </h3>
          </div>
          <div className="relative">
            <Editor
              height="400px"
              theme={darkMode ? "vs-dark" : "light"}
              language={monacoLanguage}
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ 
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 }
              }}
              onMount={onMount}
            />
          </div>
        </div>

        {/* Input/Output Panel */}
        <div className={`rounded-2xl ${theme.panel} shadow-xl border border-sky-100 dark:border-gray-700`}>
          <div className={`p-3 md:p-4 ${theme.header} border-b border-sky-100 dark:border-gray-600`}>
            <h3 className={`font-bold text-sm md:text-lg ${theme.text} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Input & Output
            </h3>
          </div>
          <div className="p-3 md:p-4 space-y-4 md:space-y-6">
            {/* Input Section */}
            <div>
              <label className={`block text-xs md:text-sm font-semibold mb-2 ${theme.text} flex items-center gap-2`}>
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                Input
              </label>
              <textarea
                className={`w-full h-24 md:h-32 rounded-xl p-3 md:p-4 text-xs md:text-sm resize-none ${theme.input} shadow-sm border-0 focus:ring-2 focus:ring-sky-400 transition-all duration-200`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your input here..."
              />
            </div>

            {/* Expected Output Section */}
            <div>
              <label className={`block text-xs md:text-sm font-semibold mb-2 ${theme.text} flex items-center gap-2`}>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Expected Output
              </label>
              <textarea
                className={`w-full h-20 md:h-24 rounded-xl p-3 md:p-4 text-xs md:text-sm resize-none ${theme.input} shadow-sm border-0 focus:ring-2 focus:ring-sky-400 transition-all duration-200`}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Enter expected output for comparison..."
              />
              
              {/* Compare Options */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6 mt-3">
                <label className={`inline-flex items-center gap-2 text-xs md:text-sm ${theme.textSecondary} cursor-pointer hover:${theme.text} transition-colors duration-200`}>
                  <input 
                    type="checkbox" 
                    checked={ignoreWhitespace} 
                    onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-400 w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="font-medium">Ignore whitespace</span>
                </label>
                <label className={`inline-flex items-center gap-2 text-xs md:text-sm ${theme.textSecondary} cursor-pointer hover:${theme.text} transition-colors duration-200`}>
                  <input 
                    type="checkbox" 
                    checked={ignoreCase} 
                    onChange={(e) => setIgnoreCase(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-400 w-3 h-3 md:w-4 md:h-4"
                  />
                  <span className="font-medium">Ignore case</span>
                </label>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <label className={`block text-xs md:text-sm font-semibold ${theme.text} flex items-center gap-2`}>
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Output
                </label>
                <div className={`text-[10px] md:text-xs ${theme.textMuted} font-medium flex items-center gap-3`}>
                  {runtimeMs != null && (
                    <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-lg flex items-center gap-1">
                      <span className="text-xs">⏱️</span> {runtimeMs} ms
                    </span>
                  )}
                  {exitCode != null && (
                    <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                      Exit: {exitCode}
                    </span>
                  )}
                </div>
              </div>
              <textarea 
                className={`w-full h-20 md:h-24 rounded-xl p-3 md:p-4 text-xs md:text-sm resize-none ${theme.input} shadow-sm border-0`}
                value={output} 
                readOnly 
                placeholder="Output will appear here..."
              />
              
              {/* Pass/Fail Indicator */}
              {passed !== null && (
                <div className={`mt-3 p-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 ${passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'} shadow-sm`}>
                  <span className="text-sm md:text-base">{passed ? '✅' : '❌'}</span>
                  <span>{passed ? 'Test Passed!' : 'Test Failed'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-testcase Panel */}
      <div className={`rounded-2xl ${theme.panel} shadow-xl border border-sky-100 dark:border-gray-700`}>
        <div className={`p-4 md:p-6 ${theme.header} border-b border-sky-100 dark:border-gray-600`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className={`text-base md:text-xl font-bold ${theme.text} flex items-center gap-3`}>
              <span className="w-3 h-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></span>
              Test Cases
            </h3>
            
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold ${theme.button.primary} shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2`}
                onClick={() => setTestcases((t) => [...t, { input: '', expected: '' }])}
              >
                <span className="text-sm">➕</span>
                <span className="hidden sm:inline">Add Test</span>
              </button>
              
              <button
                className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold ${theme.button.danger} shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2`}
                onClick={resetTestcases}
                disabled={testcases.length === 0}
              >
                <span className="text-sm">🗑️</span>
                <span className="hidden sm:inline">Reset</span>
              </button>
              
              <button
                className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold ${theme.button.purple} shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2`}
                onClick={exportTestcases}
                disabled={testcases.length === 0}
              >
                <span className="text-sm">📤</span>
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <label className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold cursor-pointer ${theme.button.indigo} shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2`}>
                <span className="text-sm">📥</span>
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importTestcases}
                  className="hidden"
                />
              </label>
              
              <button
                className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold ${theme.button.emerald} shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 min-w-[100px] justify-center`}
                onClick={runAll}
                disabled={testcases.length === 0 || running}
              >
                {running ? (
                  <>
                    <div className="inline-block animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Running...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">🚀</span>
                    <span className="hidden sm:inline">Run All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Test Cases Grid */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {testcases.map((tc, idx) => (
              <div key={idx} className={`rounded-2xl p-4 md:p-5 ${theme.testcase} shadow-lg border border-sky-50 dark:border-gray-600 hover:shadow-xl transition-all duration-300`}>
                {/* Test Case Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-xs md:text-sm font-bold ${theme.text} flex items-center gap-2`}>
                    <span className="w-6 h-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span>Test Case #{idx + 1}</span>
                  </div>
                  <button
                    className={`text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-2 rounded-lg ${theme.button.danger} font-semibold hover:scale-105 transition-all duration-200 shadow-sm`}
                    onClick={() => setTestcases((t) => t.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                </div>

                {/* Input and Expected Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div>
                    <label className={`block text-[10px] md:text-xs font-bold mb-2 ${theme.text} flex items-center gap-1`}>
                      <span className="w-1 h-1 bg-sky-400 rounded-full"></span>
                      Input
                    </label>
                    <textarea
                      className={`w-full h-16 md:h-20 rounded-xl p-2 md:p-3 text-[10px] md:text-xs resize-none ${theme.input} shadow-sm border-0 focus:ring-2 focus:ring-sky-400 transition-all duration-200`}
                      value={tc.input}
                      onChange={(e) => setTestcases((t) => t.map((x, i) => i === idx ? { ...x, input: e.target.value } : x))}
                      placeholder="Test input..."
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] md:text-xs font-bold mb-2 ${theme.text} flex items-center gap-1`}>
                      <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                      Expected
                    </label>
                    <textarea
                      className={`w-full h-16 md:h-20 rounded-xl p-2 md:p-3 text-[10px] md:text-xs resize-none ${theme.input} shadow-sm border-0 focus:ring-2 focus:ring-sky-400 transition-all duration-200`}
                      value={tc.expected}
                      onChange={(e) => setTestcases((t) => t.map((x, i) => i === idx ? { ...x, expected: e.target.value } : x))}
                      placeholder="Expected output..."
                    />
                  </div>
                </div>

                {/* Output Section (if available) */}
                {typeof tc.output === 'string' && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <label className={`block text-[10px] md:text-xs font-bold ${theme.text} flex items-center gap-1`}>
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                        Actual Output
                      </label>
                      <div className={`text-[9px] md:text-[10px] ${theme.textMuted} font-medium flex items-center gap-2`}>
                        {tc.runtimeMs != null && (
                          <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
                            <span>⏱️</span> {tc.runtimeMs}ms
                          </span>
                        )}
                        {tc.exitCode != null && (
                          <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                            Exit: {tc.exitCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <textarea 
                      className={`w-full h-14 md:h-16 rounded-xl p-2 md:p-3 text-[10px] md:text-xs resize-none ${theme.input} shadow-sm border-0`}
                      readOnly 
                      value={tc.output} 
                    />
                    
                    {/* Pass/Fail Status */}
                    {typeof tc.passed !== 'undefined' && (
                      <div className={`mt-3 p-2 md:p-3 rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-2 ${tc.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'} shadow-sm`}>
                        <span className="text-xs md:text-sm">{tc.passed ? '✅' : '❌'}</span>
                        <span>{tc.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {testcases.length === 0 && (
            <div className={`text-center py-12 md:py-16 ${theme.textMuted}`}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl md:text-3xl">📝</span>
              </div>
              <p className="text-base md:text-lg font-semibold mb-2">No test cases yet</p>
              <p className="text-xs md:text-sm">Add a test case to get started with testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;