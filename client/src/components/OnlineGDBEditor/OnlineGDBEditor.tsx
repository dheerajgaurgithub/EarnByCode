import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

export type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface OnlineGDBEditorProps {
  code: string;
  language: Language;
  onRun: (code: string, language: Language) => Promise<void>;
  onCodeChange?: (code: string, language: Language) => void;
  isRunning: boolean;
  isSubmitting: boolean;
  testCases?: Array<{ input: string; expected: string }>;
}

// Map our language codes to OnlineGDB language codes and Monaco editor language IDs
const languageMap: Record<Language, { onlineGdbId: string; monacoLang: string }> = {
  'javascript': { onlineGdbId: 'nodejs', monacoLang: 'javascript' },
  'python': { onlineGdbId: 'python3', monacoLang: 'python' },
  'java': { onlineGdbId: 'java', monacoLang: 'java' },
  'cpp': { onlineGdbId: 'cpp', monacoLang: 'cpp' }
};

// Default code templates for each language
const defaultCodeTemplates: Record<Language, string> = {
  'javascript': '// Write your JavaScript code here\nconsole.log("Hello, World!");',
  'python': '# Write your Python code here\nprint("Hello, World!")',
  'java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}',
  'cpp': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
};

const OnlineGDBEditor: React.FC<OnlineGDBEditorProps> = ({
  code: initialCode,
  language: initialLanguage,
  onRun,
  onCodeChange,
  isRunning,
  isSubmitting,
  testCases = []
}) => {
  const [code, setCode] = useState(initialCode || defaultCodeTemplates[initialLanguage]);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'test'>('code');
  const [testResults, setTestResults] = useState<Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    status: 'pending' | 'running' | 'completed';
  }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [lastCodeUpdate, setLastCodeUpdate] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode, currentLanguage);
    }
  };

  // Execute code using OnlineGDB API
  const executeCode = async (input: string = '') => {
    setIsExecuting(true);
    setError(null);
    setOutput('Executing code...\n');
    setActiveTab('output');

    try {
      const response = await axios.post('https://www.onlinegdb.com/compile_web_standalone', {
        program: code,
        language: languageMap[currentLanguage].onlineGdbId,
        input: input,
        command: ''
      });

      if (response.data) {
        if (response.data.stdout) {
          setOutput(prev => prev + response.data.stdout);
        }
        if (response.data.stderr) {
          setOutput(prev => prev + '\nError: ' + response.data.stderr);
        }
        if (response.data.compile_output) {
          setOutput(prev => prev + '\nCompilation Output: ' + response.data.compile_output);
        }
      }
    } catch (err) {
      console.error('Error executing code:', err);
      setError('Failed to execute code. Please try again.');
      setOutput('Error: ' + (err as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run all test cases
  const runAllTests = async () => {
    if (testCases.length === 0) {
      setError('No test cases available.');
      return;
    }

    setActiveTab('test');
    setTestResults(testCases.map(test => ({
      ...test,
      actual: '',
      passed: false,
      status: 'pending' as const
    })));

    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      setTestResults(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'running' };
        return updated;
      });

      try {
        const response = await axios.post('https://www.onlinegdb.com/compile_web_standalone', {
          program: code,
          language: languageMap[currentLanguage].onlineGdbId,
          input: test.input,
          command: ''
        });

        const actualOutput = response.data.stdout?.trim() || '';
        const passed = actualOutput === test.expected;

        setTestResults(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            actual: actualOutput,
            passed,
            status: 'completed' as const
          };
          return updated;
        });
      } catch (err) {
        console.error(`Test case ${i + 1} failed:`, err);
        setTestResults(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            actual: 'Error: ' + (err as Error).message,
            passed: false,
            status: 'completed' as const
          };
          return updated;
        });
      }
    }
  };
  
  // Handle run button click
  const handleRun = async () => {
    setOutput('');
    await executeCode();
  };

  // Handle language change
  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    // Update code to default template if it's the initial code or empty
    if (!code || code === defaultCodeTemplates[currentLanguage]) {
      setCode(defaultCodeTemplates[lang]);
      if (onCodeChange) {
        onCodeChange(defaultCodeTemplates[lang], lang);
      }
    }
  };

  // Initialize the editor when component mounts
  useEffect(() => {
    try {
      // Only load the script if it hasn't been loaded already
      if (!document.querySelector('script[src*="onlinegdb.com/static/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.onlinegdb.com/static/embed.js';
        script.async = true;
        script.integrity = 'sha384-...'; // Add integrity hash if available
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          console.log('OnlineGDB script loaded successfully');
          setError(null);
        };
        script.onerror = (e) => {
          console.error('Failed to load OnlineGDB script:', e);
          setError('Failed to load OnlineGDB editor. Please check your internet connection and try again.');
        };
        document.body.appendChild(script);
      }

      // Handle fullscreen change events
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      // Handle message events from the iframe
      const handleMessage = (event: MessageEvent) => {
        // Add origin validation if needed
        // if (event.origin !== 'https://www.onlinegdb.com') return;
        
        if (event.data?.type === 'codeUpdate' && onCodeChange) {
          onCodeChange(event.data.code, currentLanguage);
        }
      };

      window.addEventListener('message', handleMessage);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        window.removeEventListener('message', handleMessage);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    } catch (err) {
      setError('Error initializing the code editor. Please refresh the page.');
      console.error('Editor initialization error:', err);
    }
  }, [onCodeChange]);

  
  // Handle language changes
  useEffect(() => {
    if (initialLanguage !== currentLanguage) {
      setCurrentLanguage(initialLanguage);
      // Force iframe reload when language changes
      setIsInitialized(false);
      setIsReloading(true);
    }
  }, [initialLanguage, currentLanguage]);

  // Handle code updates from parent
  useEffect(() => {
    if (isInitialized && iframeRef.current?.contentWindow && Date.now() - lastCodeUpdate > 1000) {
      iframeRef.current.contentWindow.postMessage({
        type: 'setCode',
        code: initialCode,
        language: languageMap[currentLanguage],
      }, '*');
    }
  }, [initialCode, isInitialized, currentLanguage, lastCodeUpdate]);

  // Handle reloading the editor
  const handleReload = useCallback(() => {
    setIsInitialized(false);
    setIsReloading(true);
    setError(null);
    setLastCodeUpdate(Date.now());
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        const editorElement = iframeRef.current?.parentElement?.parentElement;
        if (editorElement?.requestFullscreen) {
          editorElement.requestFullscreen().catch(console.error);
        } else if ((editorElement as any)?.webkitRequestFullscreen) {
          // Safari support
          (editorElement as any).webkitRequestFullscreen();
        } else if ((editorElement as any)?.msRequestFullscreen) {
          // IE11 support
          (editorElement as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(console.error);
        } else if ((document as any).webkitExitFullscreen) {
          // Safari support
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          // IE11 support
          (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      setError('Could not toggle fullscreen mode. Your browser may not support this feature.');
    }
  }, []);

  // Get the URL for the current language
  const getIframeUrl = useCallback(() => {
    const lang = languageMap[currentLanguage] || 'cpp';
    // Use the standard OnlineGDB editor URL
    return `https://www.onlinegdb.com/online_${lang}_compiler`;
  }, [currentLanguage]);

  // Get language display name
  const getLanguageName = useCallback(() => {
    const names: Record<Language, string> = {
      'javascript': 'JavaScript (Node.js)',
      'python': 'Python 3',
      'java': 'Java',
      'cpp': 'C++',
    };
    return names[currentLanguage] || currentLanguage;
  }, [currentLanguage]);

  const currentLanguageName = getLanguageName();
  const languageOptions: Language[] = ['javascript', 'python', 'java', 'cpp'];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Enter or Cmd+Enter to run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isExecuting && !isSubmitting) {
          handleRun();
        }
      }
      // F11 to toggle fullscreen
      else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Escape to exit fullscreen
      else if (e.key === 'Escape' && document.fullscreenElement) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExecuting, isSubmitting, handleRun, toggleFullscreen]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Language and action buttons */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExecuting || isSubmitting}
          >
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {getLanguageName()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            disabled={isExecuting || isSubmitting}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Running...
              </>
            ) : (
              <>
                <Play className="-ml-0.5 mr-1.5 h-4 w-4" />
                Run
              </>
            )}
          </button>
          {testCases.length > 0 && (
            <button
              onClick={runAllTests}
              disabled={isExecuting || isSubmitting}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </button>
          )}
          <button
            onClick={() => onRun(code, currentLanguage)}
            disabled={isExecuting || isSubmitting}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'output'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Output
          </button>
          {testCases.length > 0 && (
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Test Results
              {testResults.some((r) => r.status === 'completed') && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-xs font-medium text-white bg-green-500">
                  {testResults.filter((r) => r.passed).length}/{testResults.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-400"
              aria-label="Dismiss error"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage={languageMap[currentLanguage].monacoLang}
              language={languageMap[currentLanguage].monacoLang}
              theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
                padding: { top: 10 },
              }}
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 h-full overflow-auto">
            {output ? (
              <pre className="whitespace-pre-wrap break-words">{output}</pre>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Run the code to see the output here.
              </div>
            )}
          </div>
        )}

        {activeTab === 'test' && testCases.length > 0 && (
          <div className="p-4 space-y-4 overflow-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'completed'
                    ? result.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Test Case {index + 1}</span>
                  {result.status === 'pending' && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      Pending
                    </span>
                  )}
                  {result.status === 'running' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded inline-flex items-center">
                      <Loader2 className="animate-spin mr-1 h-3 w-3" />
                      Running
                    </span>
                  )}
                  {result.status === 'completed' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        result.passed
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Input</div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                      {result.input || 'No input'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Output</div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                      {result.expected || 'No expected output'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {result.status === 'completed' ? 'Actual Output' : 'Status'}
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm min-h-[2.5rem]">
                      {result.status === 'pending' && 'Not run yet'}
                      {result.status === 'running' && 'Running...'}
                      {result.status === 'completed' && (result.actual || 'No output')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineGDBEditor;
