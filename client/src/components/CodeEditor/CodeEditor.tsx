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
    <div className={`p-4 ${theme.container}`}>
      {/* Header with theme toggle */}
      <div className={`flex justify-between items-center mb-4 p-4 rounded-lg ${theme.header}`}>
        <div className="flex items-center gap-4">
          <h1 className={`text-xl font-bold ${theme.text}`}>Code Editor</h1>
          {problemId && (
            <span className={`text-sm px-2 py-1 rounded ${theme.textMuted}`}>
              Problem: {problemId}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-2 rounded-lg ${theme.button.secondary} flex items-center gap-2`}
          >
            {darkMode ? '☀️' : '🌙'}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${theme.text}`}>Language:</label>
            <select
              className={`px-3 py-2 rounded-lg ${theme.input}`}
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
            className={`px-4 py-2 rounded-lg disabled:opacity-60 ${theme.button.success} flex items-center gap-2`}
          >
            {running ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Running...
              </>
            ) : (
              <>
                ▶️ Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Editor and IO Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Code Editor */}
        <div className={`rounded-lg overflow-hidden ${theme.panel}`}>
          <div className={`p-3 ${theme.header}`}>
            <h3 className={`font-semibold ${theme.text}`}>Code Editor</h3>
          </div>
          <Editor
            height="500px"
            theme={darkMode ? "vs-dark" : "light"}
            language={monacoLanguage}
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{ 
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
            onMount={onMount}
          />
        </div>

        {/* Input/Output Panel */}
        <div className={`rounded-lg ${theme.panel}`}>
          <div className={`p-3 ${theme.header}`}>
            <h3 className={`font-semibold ${theme.text}`}>Input & Output</h3>
          </div>
          <div className="p-3 space-y-4">
            {/* Input Section */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Input</label>
              <textarea
                className={`w-full h-32 rounded-lg p-3 text-sm resize-none ${theme.input}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your input here..."
              />
            </div>

            {/* Expected Output Section */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Expected Output</label>
              <textarea
                className={`w-full h-24 rounded-lg p-3 text-sm resize-none ${theme.input}`}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Enter expected output for comparison..."
              />
              
              {/* Compare Options */}
              <div className="flex items-center gap-6 mt-2">
                <label className={`inline-flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <input 
                    type="checkbox" 
                    checked={ignoreWhitespace} 
                    onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    className="rounded"
                  />
                  Ignore whitespace
                </label>
                <label className={`inline-flex items-center gap-2 text-sm ${theme.textSecondary}`}>
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

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${theme.text}`}>Output</label>
                <div className={`text-xs ${theme.textMuted}`}>
                  {runtimeMs != null && <span className="mr-3">⏱️ {runtimeMs} ms</span>}
                  {exitCode != null && <span>Exit: {exitCode}</span>}
                </div>
              </div>
              <textarea 
                className={`w-full h-24 rounded-lg p-3 text-sm resize-none ${theme.input}`}
                value={output} 
                readOnly 
                placeholder="Output will appear here..."
              />
              
              {/* Pass/Fail Indicator */}
              {passed !== null && (
                <div className={`mt-2 text-sm font-semibold flex items-center gap-2 ${passed ? theme.success : theme.error}`}>
                  <span>{passed ? '✅' : '❌'}</span>
                  {passed ? 'Test Passed!' : 'Test Failed'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-testcase Panel */}
      <div className={`rounded-lg ${theme.panel}`}>
        <div className={`p-4 ${theme.header}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className={`text-lg font-semibold ${theme.text}`}>Test Cases</h3>
            
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm ${theme.button.primary}`}
                onClick={() => setTestcases((t) => [...t, { input: '', expected: '' }])}
              >
                ➕ Add Test Case
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm ${theme.button.danger}`}
                onClick={resetTestcases}
                disabled={testcases.length === 0}
              >
                🗑️ Reset All
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm ${theme.button.purple}`}
                onClick={exportTestcases}
                disabled={testcases.length === 0}
              >
                📤 Export
              </button>
              
              <label className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${theme.button.indigo}`}>
                📥 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importTestcases}
                  className="hidden"
                />
              </label>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm ${theme.button.emerald}`}
                onClick={runAll}
                disabled={testcases.length === 0 || running}
              >
                {running ? (
                  <>
                    <div className="inline-block animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-2"></div>
                    Running...
                  </>
                ) : (
                  '🚀 Run All Tests'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Test Cases Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {testcases.map((tc, idx) => (
              <div key={idx} className={`rounded-lg p-4 ${theme.testcase}`}>
                {/* Test Case Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-sm font-medium ${theme.text}`}>
                    Test Case #{idx + 1}
                  </div>
                  <button
                    className={`text-xs px-2 py-1 rounded ${theme.button.danger}`}
                    onClick={() => setTestcases((t) => t.filter((_, i) => i !== idx))}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Input and Expected Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.text}`}>Input</label>
                    <textarea
                      className={`w-full h-20 rounded p-2 text-xs resize-none ${theme.input}`}
                      value={tc.input}
                      onChange={(e) => setTestcases((t) => t.map((x, i) => i === idx ? { ...x, input: e.target.value } : x))}
                      placeholder="Test input..."
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.text}`}>Expected Output</label>
                    <textarea
                      className={`w-full h-20 rounded p-2 text-xs resize-none ${theme.input}`}
                      value={tc.expected}
                      onChange={(e) => setTestcases((t) => t.map((x, i) => i === idx ? { ...x, expected: e.target.value } : x))}
                      placeholder="Expected output..."
                    />
                  </div>
                </div>

                {/* Output Section (if available) */}
                {typeof tc.output === 'string' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-xs font-medium ${theme.text}`}>Actual Output</label>
                      <div className={`text-[10px] ${theme.textMuted}`}>
                        {tc.runtimeMs != null && <span className="mr-2">⏱️ {tc.runtimeMs}ms</span>}
                        {tc.exitCode != null && <span>Exit: {tc.exitCode}</span>}
                      </div>
                    </div>
                    <textarea 
                      className={`w-full h-16 rounded p-2 text-xs resize-none ${theme.input}`}
                      readOnly 
                      value={tc.output} 
                    />
                    
                    {/* Pass/Fail Status */}
                    {typeof tc.passed !== 'undefined' && (
                      <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${tc.passed ? theme.success : theme.error}`}>
                        <span>{tc.passed ? '✅' : '❌'}</span>
                        {tc.passed ? 'Passed' : 'Failed'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {testcases.length === 0 && (
            <div className={`text-center py-12 ${theme.textMuted}`}>
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg mb-2">No test cases yet</p>
              <p className="text-sm">Add a test case to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;