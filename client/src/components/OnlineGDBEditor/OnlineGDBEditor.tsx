import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCw, 
  AlertCircle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  XCircle, 
  Loader2,
  CheckCircle 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios, { AxiosError } from 'axios';
import './OnlineGDBEditor.css';
export type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface OnlineGDBEditorProps {
  code: string;
  language: Language;
  onRun: (code: string, language: Language) => Promise<void>;
  onCodeChange?: (code: string, language: Language) => void;
  isSubmitting: boolean;
  isRunning?: boolean;
  testCases?: Array<{ input: string; expected: string }>;
}

const languageMap: Record<Language, { onlineGdbId: string; monacoLang: string }> = {
  'javascript': { onlineGdbId: 'nodejs', monacoLang: 'javascript' },
  'python': { onlineGdbId: 'python3', monacoLang: 'python' },
  'java': { onlineGdbId: 'java', monacoLang: 'java' },
  'cpp': { onlineGdbId: 'cpp', monacoLang: 'cpp' }
};

const defaultCodeTemplates: Record<Language, string> = {
  'javascript': '// Write your JavaScript code here\nconsole.log("Hello, World!");',
  'python': '# Write your Python code here\nprint("Hello, World!")',
  'java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}',
  'cpp': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
};

const languageNames: Record<Language, string> = {
  'javascript': 'JavaScript (Node.js)',
  'python': 'Python 3',
  'java': 'Java',
  'cpp': 'C++'
};

const OnlineGDBEditor: React.FC<OnlineGDBEditorProps> = ({
  code: initialCode,
  language: initialLanguage,
  onRun,
  onCodeChange,
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode, currentLanguage);
    }
  }, [currentLanguage, onCodeChange]);

  const executeCode = async (input: string = '', retryCount = 0): Promise<void> => {
    const maxRetries = 2;
    setIsExecuting(true);
    setError(null);
    setOutput(prev => prev ? `${prev}\n---\nExecuting code...` : 'Executing code...');
    setActiveTab('output');

    try {
      const response = await axios.post('https://www.onlinegdb.com/compile_web_standalone', {
        program: code,
        language: languageMap[currentLanguage].onlineGdbId,
        input: input,
        command: ''
      }, {
        timeout: 15000, 
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        let outputText = '';
        if (response.data.stdout) outputText += response.data.stdout;
        if (response.data.stderr) outputText += `\nError: ${response.data.stderr}`;
        if (response.data.compile_output) outputText += `\nCompilation Output: ${response.data.compile_output}`;
        
        setOutput(prev => prev ? `${prev}\n${outputText}` : outputText);
      }
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error executing code:', error);
      
      if (retryCount < maxRetries) {
        setOutput(prev => `${prev}\nRetrying... (${retryCount + 1}/${maxRetries})`);
        return executeCode(input, retryCount + 1);
      }
      
      const errorMessage = error.response
        ? `Server responded with ${error.response.status}: ${error.response.statusText}`
        : error.request
        ? 'No response from server. Please check your connection.'
        : error.message || 'Failed to execute code. Please try again.';
        
      setError('Execution failed');
      setOutput(prev => `${prev}\nError: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

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
  
  const handleRun = async () => {
    setOutput('');
    await executeCode();
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    if (!code || code === defaultCodeTemplates[currentLanguage]) {
      setCode(defaultCodeTemplates[lang]);
      if (onCodeChange) {
        onCodeChange(defaultCodeTemplates[lang], lang);
      }
    }
  };

  const handleReload = useCallback(() => {
    setError(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        const editorElement = iframeRef.current?.parentElement?.parentElement;
        if (editorElement?.requestFullscreen) {
          editorElement.requestFullscreen().catch(console.error);
        } else if ((editorElement as any)?.webkitRequestFullscreen) {
          (editorElement as any).webkitRequestFullscreen();
        } else if ((editorElement as any)?.msRequestFullscreen) {
          (editorElement as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(console.error);
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      setError('Could not toggle fullscreen mode. Your browser may not support this feature.');
    }
  }, []);

  const getIframeUrl = useCallback(() => {
    const lang = languageMap[currentLanguage]?.onlineGdbId || 'cpp';
    return `https://www.onlinegdb.com/online_${lang}_compiler`;
  }, [currentLanguage]);

  const languageOptions: Language[] = ['javascript', 'python', 'java', 'cpp'];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!isExecuting && !isSubmitting) {
        handleRun();
      }
    } else if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'Escape' && document.fullscreenElement) {
      e.preventDefault();
      toggleFullscreen();
    }
  }, [isExecuting, isSubmitting, toggleFullscreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const [showTestCases, setShowTestCases] = useState(true);

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
                {languageNames[lang]}
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

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="h-full">
            <Editor
              height="100%"
              language={languageMap[currentLanguage].monacoLang}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        )}

        {/* Output Tab */}
        {activeTab === 'output' && (
          <div className="h-full p-4">
            {isExecuting && (
              <div className="flex items-center gap-2 mb-4 text-blue-500">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Running your code...</span>
              </div>
            )}
            <pre className="font-mono text-sm whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
              {output || (error ? `Error: ${error}` : 'Run code to see output')}
            </pre>
            {error && (
              <div className="mt-4">
                <button
                  onClick={() => executeCode()}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <RotateCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Test Results Tab */}
        {activeTab === 'test' && (
          <div className="h-full p-4 overflow-auto">
            {testResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium mb-2">No test results yet</p>
                <p className="text-sm">Click "Run All Tests" to execute test cases</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.status === 'completed'
                        ? result.passed
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Test Case {index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        {result.status === 'completed' && (
                          result.passed ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle className="h-4 w-4" />
                              Failed
                            </span>
                          )
                        )}
                        {result.status === 'running' && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Loader2 className="animate-spin h-4 w-4" />
                            Running
                          </span>
                        )}
                        {result.status === 'pending' && (
                          <span className="text-gray-500 dark:text-gray-400">Pending</span>
                        )}
                      </div>
                    </div>

                    {result.input && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Input
                        </div>
                        <pre className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                          {result.input}
                        </pre>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Expected Output
                      </div>
                      <pre className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                        {result.expected || 'No expected output'}
                      </pre>
                    </div>

                    {result.status === 'completed' && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Actual Output
                        </div>
                        <pre className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
                          {result.actual || 'No output'}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add CSS for the editor component
const styles = `
  .online-gdb-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .online-gdb-editor.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
  }

  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #252526;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .language-scroll-container {
    flex: 1;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .language-scroll-container::-webkit-scrollbar {
    height: 4px;
  }

  .language-scroll-container::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 2px;
  }

  .language-tabs {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }

  .language-tab {
    padding: 6px 12px;
    background: #2d2d2d;
    border: 1px solid #3c3c3c;
    border-radius: 4px;
    color: #ccc;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .language-tab:hover {
    background: #37373d;
    color: #fff;
  }

  .language-tab.active {
    background: #0e639c;
    color: #fff;
    border-color: #1177bb;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Add styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default OnlineGDBEditor;