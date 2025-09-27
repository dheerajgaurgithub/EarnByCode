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
  const [codeByLang, setCodeByLang] = useState<Record<Lang, string>>({
    Java: DEFAULT_SNIPPETS.Java,
    Cpp: DEFAULT_SNIPPETS.Cpp,
    Python: DEFAULT_SNIPPETS.Python,
    JavaScript: DEFAULT_SNIPPETS.JavaScript,
  });
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [expected, setExpected] = useState<string>("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null);
  const [memoryKb, setMemoryKb] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [compilerLog, setCompilerLog] = useState<string>("");
  const [showLog, setShowLog] = useState<boolean>(false);
  const [errorDecorations, setErrorDecorations] = useState<string[]>([]);
  const [stdoutText, setStdoutText] = useState<string>("");
  const [stderrText, setStderrText] = useState<string>("");
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [errorIdx, setErrorIdx] = useState<number>(0);
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

  // Try to extract a meaningful line number and short message from toolchain output
  const parseError = (language: Lang, text: string): { line: number | null; summary: string | null; lines: number[] } => {
    try {
      const t = text || '';
      const lines: number[] = [];
      // Java (javac): Main.java:23: error: ...
      if (language === 'Java') {
        const m = t.match(/\.java:(\d+):\s*error\b/i);
        if (m) lines.push(parseInt(m[1], 10));
        // runtime stack traces often include ":<line>"
        const g2 = t.match(/\([A-Za-z_]\w*\.java:(\d+)\)/g) || [];
        g2.forEach(s => { const m3 = s.match(/:(\d+)\)/); if (m3) lines.push(parseInt(m3[1], 10)); });
        const first = lines.length ? lines[0] : null;
        return { line: first, summary: t.split(/\r?\n/)[0] || null, lines };
      }
      // C++ (g++): main.cpp:12:5: error: ... OR a.exe: ...
      if (language === 'Cpp') {
        const rgAll = /:(\d+)(?::\d+)?\s*:.*error/gi;
        let mm; while ((mm = rgAll.exec(t)) !== null) { lines.push(parseInt(mm[1], 10)); }
        const first = lines.length ? lines[0] : null;
        return { line: first, summary: t.split(/\r?\n/)[0] || null, lines };
      }
      // Python: File "<stdin>", line 3, ... or File "...", line N
      if (language === 'Python') {
        const rgAll = /File\s+"[^"]+",\s+line\s+(\d+)/gi;
        let mm; while ((mm = rgAll.exec(t)) !== null) { lines.push(parseInt(mm[1], 10)); }
        const first = lines.length ? lines[0] : null;
        return { line: first, summary: t.split(/\r?\n/).pop() || 'Error', lines };
      }
      // JavaScript (Node): <anonymous>:3:15 or stack traces with :line:col
      if (language === 'JavaScript') {
        const rgAll = /:(\d+):(\d+)/g;
        let mm; while ((mm = rgAll.exec(t)) !== null) { lines.push(parseInt(mm[1], 10)); }
        const first = lines.length ? lines[0] : null;
        return { line: first, summary: t.split(/\r?\n/)[0] || null, lines };
      }
      return { line: null, summary: (t || '').split(/\r?\n/)[0] || null, lines };
    } catch {
      return { line: null, summary: null, lines: [] };
    }
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

  // Load problem test cases and starter code if problem ID is in route
  useEffect(() => {
    const loadProblem = async () => {
      if (routeProblemId) {
        try {
          setProblemId(routeProblemId);
          // Load test cases
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
          // Load problem details to get starterCode (if available)
          try {
            const pr = await fetch(`/api/problems/${routeProblemId}`);
            if (pr.ok) {
              const pd = await pr.json();
              const sc = (pd?.problem?.starterCode) || (pd?.starterCode) || {};
              if (sc && typeof sc === 'object') {
                const mapLangKey = (k: string): Lang | null => {
                  const key = String(k || '').toLowerCase();
                  if (key === 'cpp' || key === 'c++') return 'Cpp';
                  if (key === 'java') return 'Java';
                  if (key === 'python' || key === 'py') return 'Python';
                  if (key === 'javascript' || key === 'js' || key === 'node') return 'JavaScript';
                  return null;
                };
                const next: Record<Lang, string> = { ...codeByLang } as any;
                (Object.keys(sc) as string[]).forEach(k => {
                  const lk = mapLangKey(k);
                  if (!lk) return;
                  const val = typeof sc[k] === 'string' ? sc[k] : '';
                  // Only apply starter if user hasn't edited for that language
                  const current = next[lk];
                  const isDefault = current === DEFAULT_SNIPPETS[lk];
                  if (isDefault) next[lk] = val || current;
                });
                setCodeByLang(next);
                // also set current code if the current language buffer is still default
                if (next[lang] !== codeByLang[lang] && (code === DEFAULT_SNIPPETS[lang])) {
                  setCode(next[lang]);
                }
              }
            }
          } catch {}
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

  // Persist Input/Expected between sessions
  useEffect(() => {
    try {
      const savedIn = localStorage.getItem('codeEditor:input');
      const savedEx = localStorage.getItem('codeEditor:expected');
      if (savedIn !== null) setInput(savedIn);
      if (savedEx !== null) setExpected(savedEx);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('codeEditor:input', input); } catch {}
  }, [input]);
  useEffect(() => {
    try { localStorage.setItem('codeEditor:expected', expected); } catch {}
  }, [expected]);

  // When language changes, show that language's buffer
  useEffect(() => {
    setCode(codeByLang[lang] ?? DEFAULT_SNIPPETS[lang]);
  }, [lang, codeByLang]);

  const monacoLanguage =
    lang === "Cpp" ? "cpp" : lang === "JavaScript" ? "javascript" : lang.toLowerCase();

  // Auto-wrap Java sources so users aren't forced to name the main class 'Main'
  const autoWrapJava = (src: string): string => {
    try {
      const code = src || '';
      // If already defines public class Main, no change
      if (/public\s+class\s+Main\b/.test(code)) return code;

      // Extract optional package declaration to reuse in wrapper
      const packageMatch = code.match(/^\s*package\s+([\w\.]+);/m);
      const pkgLine = packageMatch ? packageMatch[0] + "\n" : '';

      // Find a public class Name
      const publicClassMatch = code.match(/public\s+class\s+([A-Za-z_]\w*)/);
      if (!publicClassMatch) {
        // No public class; try class with main without public
        const anyMainMatch = code.match(/class\s+([A-Za-z_]\w*)[\s\S]*?\bpublic\s+static\s+void\s+main\s*\(/);
        if (!anyMainMatch) return code; // cannot safely wrap
        const cls = anyMainMatch[1];
        // Add a delegating public Main wrapper; keep original code untouched
        return `${pkgLine}${code}\n\npublic class Main { public static void main(String[] args) throws Exception { ${cls}.main(args); } }`;
      }

      const originalName = publicClassMatch[1];
      // Replace 'public class Name' with 'class Name'
      const withoutPublic = code.replace(/public\s+class\s+([A-Za-z_]\w*)/, (m, g1) => `class ${g1}`);
      // Append wrapper Main delegating to the original main
      const wrapped = `${pkgLine}${withoutPublic}\n\npublic class Main { public static void main(String[] args) throws Exception { ${originalName}.main(args); } }`;
      return wrapped;
    } catch {
      return src;
    }
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
      setErrorLine(null);
      setErrorSummary(null);
      const javaReady = lang === 'Java' ? autoWrapJava(code) : code;
      const payload = { code: javaReady, input, lang };
      const res = await fetch(`${apiBase}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const outText = typeof data?.output === "string" ? data.output : JSON.stringify(data);
      setOutput(outText);
      setStdoutText(typeof data?.stdout === 'string' ? data.stdout : outText);
      setStderrText(typeof data?.stderr === 'string' ? data.stderr : '');
      setCompilerLog(outText);
      setRuntimeMs(typeof data?.runtimeMs === 'number' ? data.runtimeMs : null);
      setMemoryKb(typeof data?.memoryKb === 'number' ? data.memoryKb : null);
      setExitCode(typeof data?.exitCode === 'number' ? data.exitCode : null);
      if (typeof data?.exitCode === 'number' && data.exitCode !== 0) {
        const info = parseError(lang, outText);
        setErrorLine(info.line);
        setErrorSummary(info.summary);
        setErrorLines(info.lines || (info.line ? [info.line] : []));
        setErrorIdx(0);
        setShowLog(true);
      }
      
      // Auto check vs expected (trim both)
      if (expected.trim().length > 0) {
        const ok = normalize((data?.output ?? "").toString()) === normalize(expected);
        setPassed(ok);
      } else {
        setPassed(null);
      }
    } catch (e: any) {
      const msg = e?.message || "Run failed";
      setOutput(msg);
      setCompilerLog(msg);
      setRuntimeMs(null);
      setMemoryKb(null);
      setExitCode(null);
      setPassed(false);
    } finally {
      setRunning(false);
    }
  };

  const runAll = async () => {
    if (testcases.length === 0) return;
    
    setRunning(true);
    setErrorLine(null);
    setErrorSummary(null);
    
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
      const javaReady = lang === 'Java' ? autoWrapJava(code) : code;
      const payload = {
        code: javaReady,
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
        setCompilerLog(output);
        setStdoutText(typeof data?.stdout === 'string' ? data.stdout : output);
        setStderrText(typeof data?.stderr === 'string' ? data.stderr : '');
        const exitCode = typeof data?.exitCode === 'number' ? data.exitCode : null;
        
        // Check if output matches expected
        const normalizedOutput = normalize(output);
        const normalizedExpected = normalize(tc.expected);
        const passed = normalizedExpected ? normalizedOutput === normalizedExpected : null;
        // If first failing case, capture its error line summary
        if (exitCode != null && exitCode !== 0 && errorLine == null) {
          const info = parseError(lang, output);
          setErrorLine(info.line);
          setErrorSummary(info.summary);
        }
        
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

  // Apply Monaco decoration and auto-scroll on error line
  useEffect(() => {
    try {
      const editor = editorRef.current;
      if (!editor) return;
      // clear existing decorations
      if (errorDecorations.length) {
        const cleared = editor.deltaDecorations(errorDecorations, []);
        setErrorDecorations(cleared);
      }
      if (errorLine && errorLine > 0) {
        const newDecos = editor.deltaDecorations([], [
          {
            range: {
              startLineNumber: errorLine,
              startColumn: 1,
              endLineNumber: errorLine,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: 'editor-error-line-bg',
              glyphMarginClassName: 'editor-error-glyph',
              inlineClassName: 'editor-error-inline',
            },
          },
        ]);
        setErrorDecorations(newDecos);
        editor.revealLineInCenter(errorLine);
        editor.setPosition({ lineNumber: errorLine, column: 1 });
        editor.focus();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLine]);

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
      {/* Inline styles for Monaco error decorations */}
      <style>{`
        .editor-error-line-bg { background: rgba(239, 68, 68, 0.18) !important; }
        .editor-error-glyph { background: #ef4444 !important; width: 6px !important; }
        .editor-error-inline { border-bottom: 2px solid #ef4444 !important; }
      `}</style>
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
            {lang === 'Java' && (
              <span className={`text-[10px] md:text-xs ${theme.textMuted} sm:ml-2`}>
                Hint: use <code>public class Main</code> with <code>public static void main(String[] args)</code>
              </span>
            )}
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
              onChange={(v) => {
                const val = v || '';
                setCode(val);
                setCodeByLang(prev => ({ ...prev, [lang]: val }));
              }}
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
              {/* Language-specific input tips */}
              <div className={`mt-2 text-[10px] md:text-xs ${theme.textMuted}`}>
                {lang === 'Java' && (
                  <span>Tip: provide plain integers/spaces/newlines only (e.g., "5 2" then a line of numbers). Avoid commas, labels, or brackets.</span>
                )}
                {lang === 'Cpp' && (
                  <span>Tip: stdin is passed verbatim. Use standard input patterns (e.g., cin &gt;&gt; n &gt;&gt; d).</span>
                )}
                {lang === 'Python' && (
                  <span>Tip: input() reads lines as-is. Provide exactly what your code expects, no JSON or commas unless your parser handles them.</span>
                )}
                {lang === 'JavaScript' && (
                  <span>Tip: stdin is available; if using custom runners, read from process.stdin or pre-baked helper in your template.</span>
                )}
              </div>
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
                  {memoryKb != null && (
                    <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-lg flex items-center gap-1">
                      <span className="text-xs">💾</span> {memoryKb} KB
                    </span>
                  )}
                  {exitCode != null && (
                    <span className="bg-sky-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                      {exitCode === 124 ? 'Time limit exceeded' : `Exit: ${exitCode}`}
                    </span>
                  )}
                  {errorLine != null && (
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-md ${theme.button.secondary}`}
                      onClick={() => {
                        try {
                          const editor = editorRef.current;
                          if (!editor) return;
                          editor.revealLineInCenter(errorLine);
                          editor.setPosition({ lineNumber: errorLine, column: 1 });
                          editor.focus();
                        } catch {}
                      }}
                    >
                      Go to error line
                    </button>
                  )}
                  {errorLines.length > 1 && (
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-md ${theme.button.secondary}`}
                      onClick={() => {
                        if (errorLines.length === 0) return;
                        const next = (errorIdx + 1) % errorLines.length;
                        setErrorIdx(next);
                        const ln = errorLines[next];
                        setErrorLine(ln);
                        try {
                          const editor = editorRef.current;
                          if (!editor) return;
                          editor.revealLineInCenter(ln);
                          editor.setPosition({ lineNumber: ln, column: 1 });
                          editor.focus();
                        } catch {}
                      }}
                    >
                      Next error ({(errorIdx + 1)}/{errorLines.length})
                    </button>
                  )}
                </div>
              </div>
              <textarea 
                className={`w-full h-20 md:h-24 rounded-xl p-3 md:p-4 text-xs md:text-sm resize-none ${theme.input} shadow-sm border-0`}
                value={output} 
                readOnly 
                placeholder="Output will appear here..."
              />
              {/* Compiler Log Toggle */}
              <div className="mt-3">
                <button
                  type="button"
                  className={`px-2 py-1 rounded-md text-xs ${theme.button.secondary}`}
                  onClick={() => setShowLog(v => !v)}
                >
                  {showLog ? 'Hide' : 'Show'} Compiler Log
                </button>
                {showLog && (
                  <button
                    type="button"
                    className={`ml-2 px-2 py-1 rounded-md text-xs ${theme.button.secondary}`}
                    onClick={() => { try { navigator.clipboard.writeText(compilerLog || ''); } catch {} }}
                  >
                    Copy Log
                  </button>
                )}
                {showLog && (
                  <textarea
                    className={`w-full mt-2 h-24 md:h-32 rounded-xl p-2 md:p-3 text-[10px] md:text-xs ${theme.input} shadow-sm border-0`}
                    readOnly
                    value={compilerLog}
                  />
                )}
                {showLog && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className={`text-[10px] md:text-xs font-semibold ${theme.text}`}>stdout</div>
                      <textarea
                        className={`w-full h-20 rounded-xl p-2 text-[10px] md:text-xs ${theme.input} shadow-sm border-0`}
                        readOnly
                        value={stdoutText}
                      />
                    </div>
                    <div>
                      <div className={`text-[10px] md:text-xs font-semibold ${theme.text}`}>stderr</div>
                      <textarea
                        className={`w-full h-20 rounded-xl p-2 text-[10px] md:text-xs ${theme.input} shadow-sm border-0`}
                        readOnly
                        value={stderrText}
                      />
                    </div>
                  </div>
                )}
                {errorLine != null && (
                  <div className={`mt-2 text-[10px] md:text-xs ${theme.textMuted}`}>
                    Error line: <span className="font-bold">{errorLine}</span>
                    {errorSummary ? <> — <span className="italic">{errorSummary}</span></> : null}
                  </div>
                )}
              </div>
              
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