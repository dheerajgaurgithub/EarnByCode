import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Info, Maximize2, Minimize2, Play, ExternalLink, RefreshCw } from 'lucide-react';

export type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface OnlineGDBEditorProps {
  code: string;
  language: Language;
  onRun: () => void;
  onCodeChange?: (code: string) => void;
  isRunning: boolean;
  isSubmitting: boolean;
}

// Map our language codes to OnlineGDB language codes
const languageMap: Record<Language, string> = {
  'javascript': 'nodejs',
  'python': 'python3',
  'java': 'java',
  'cpp': 'cpp'
};

const OnlineGDBEditor: React.FC<OnlineGDBEditorProps> = ({
  code: initialCode,
  language: initialLanguage,
  onRun,
  onCodeChange,
  isRunning,
  isSubmitting
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [lastCodeUpdate, setLastCodeUpdate] = useState(Date.now());

  // Initialize the editor when component mounts
  useEffect(() => {
    try {
      // Only load the script if it hasn't been loaded already
      if (!document.querySelector('script[src*="onlinegdb.com/static/embed.js"]')) {
        const script = document.createElement('script');
        script.src = '//www.onlinegdb.com/static/embed.js';
        script.async = true;
        script.onerror = () => {
          setError('Failed to load OnlineGDB editor. Please check your internet connection.');
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
        
        if (event.data && event.data.type === 'codeUpdate' && onCodeChange) {
          onCodeChange(event.data.code);
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

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsInitialized(true);
    setIsReloading(false);
    setError(null);
    
    // Inject code into the editor after a short delay to ensure it's ready
    const timer = setTimeout(() => {
      if (initialCode && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'setCode',
          code: initialCode,
          language: languageMap[currentLanguage]
        }, '*');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initialCode, currentLanguage]);
  
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
        language: languageMap[currentLanguage]
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

  // Handle run button click
  const handleRun = useCallback(() => {
    // Notify parent component to run the code
    onRun();
    
    // If we have access to the iframe, we could potentially trigger the run command directly
    // This would require the iframe to be on the same origin or have proper CORS headers
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'runCode' }, '*');
      }
    } catch (err) {
      console.warn('Could not send run command to iframe:', err);
    }
  }, [onRun]);

  // Get the URL for the current language
  const getIframeUrl = useCallback(() => {
    const lang = languageMap[currentLanguage] || 'cpp';
    const url = new URL(`https://www.onlinegdb.com/online_${lang}_compiler`);
    
    // Add initial code as URL parameter if provided
    if (initialCode && !isInitialized) {
      url.searchParams.set('code', encodeURIComponent(initialCode));
    }
    
    // Add theme parameter (light/dark)
    const isDark = document.documentElement.classList.contains('dark');
    url.searchParams.set('theme', isDark ? 'dark' : 'light');
    
    // Add unique timestamp to prevent caching issues
    url.searchParams.set('_', Date.now().toString());
    
    return url.toString();
  }, [currentLanguage, initialCode, isInitialized]);

  // Get language display name
  const getLanguageName = useCallback(() => {
    const names: Record<Language, string> = {
      'javascript': 'JavaScript (Node.js)',
      'python': 'Python 3',
      'java': 'Java',
      'cpp': 'C++'
    };
    return names[currentLanguage] || currentLanguage;
  }, [currentLanguage]);

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
        if (!isRunning && !isSubmitting) {
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
  }, [isRunning, isSubmitting, handleRun, toggleFullscreen]);

  return (
    <div 
      className={`relative flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-green-800 dark:to-green-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-blue-700/30 dark:bg-green-700/50 px-3 py-1 rounded-md border border-blue-500/30 dark:border-green-500/30">
            <span className="text-sm font-mono font-medium">{getLanguageName()}</span>
          </div>
          
          {error && (
            <div className="flex items-center bg-red-500/90 text-white px-3 py-1 rounded-md text-xs">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-blue-700/30 dark:hover:bg-green-700/30 transition-colors text-blue-100 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F11)'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
              isRunning || isSubmitting
                ? 'bg-blue-500/50 text-blue-100 cursor-not-allowed'
                : 'bg-white text-blue-700 hover:bg-blue-50 shadow-md hover:shadow-lg active:shadow-md transform hover:scale-105 active:scale-100'
            }`}
          >
            {isRunning || isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isSubmitting ? 'Submitting...' : 'Running...'}</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run Code</span>
                <span className="text-xs opacity-70 ml-1 hidden sm:inline">(Ctrl+Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help message */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
          <div className="flex items-start">
            <Info className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-300" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="font-medium">Using the OnlineGDB Editor</p>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  aria-label="Hide help"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm">
                You can write and run your code directly in the embedded OnlineGDB editor. 
                The editor supports {getLanguageName()} and provides a full development environment.
              </p>
              
              {isHelpExpanded && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-xs">
                    <kbd className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 mr-2 font-mono">
                      Ctrl+Enter
                    </kbd>
                    <span>Run code</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <kbd className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 mr-2 font-mono">
                      F11
                    </kbd>
                    <span>Toggle fullscreen</span>
                  </div>
                </div>
              )}
              
              <div className="mt-2 flex justify-between items-center">
                <button
                  onClick={() => setIsHelpExpanded(!isHelpExpanded)}
                  className="text-xs text-blue-600 dark:text-blue-300 hover:underline"
                >
                  {isHelpExpanded ? 'Show less' : 'Show more'}
                </button>
                <a
                  href="https://www.onlinegdb.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 dark:text-blue-300 hover:underline"
                >
                  <span>Learn more about OnlineGDB</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OnlineGDB iframe */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900" style={{ minHeight: '300px' }}>
        {error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Editor Failed to Load</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              {error} Please check your internet connection or try refreshing the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors flex-1 sm:flex-none"
              >
                Refresh Page
              </button>
              <a
                href="https://www.onlinegdb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center space-x-1.5 flex-1 sm:flex-none"
              >
                <span>Open OnlineGDB</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full h-full relative">
              <iframe
                ref={iframeRef}
                src={getIframeUrl()}
                className={`w-full h-full border-0 transition-opacity duration-300 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
                title={`OnlineGDB ${getLanguageName()} Editor`}
                onLoad={handleIframeLoad}
                onError={(e) => {
                  console.error('Iframe load error:', e);
                  setError('Failed to load the editor. Please check your internet connection and try again.');
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="eager"
                aria-label="Code editor"
              />
              {!isInitialized && (
                <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {isReloading ? 'Reloading editor...' : 'Loading editor...'}
                    </p>
                    <button
                      onClick={handleReload}
                      disabled={isReloading}
                      className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center mx-auto"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isReloading ? 'animate-spin' : ''}`} />
                      {isReloading ? 'Loading...' : 'Reload if stuck'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-1 sm:mb-0">
            <span className="inline-flex items-center">
              <span className="relative flex h-2 w-2 mr-1.5">
                {isInitialized ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                )}
              </span>
              <span>{isInitialized ? 'Connected to OnlineGDB' : 'Connecting...'}</span>
            </span>
            <span className="hidden md:inline-flex items-center">
              <svg className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Code runs securely in your browser</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReload}
              disabled={isReloading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center text-xs"
              title="Reload editor"
              aria-label="Reload editor"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isReloading ? 'animate-spin' : ''}`} />
              <span>Reload</span>
            </button>
            
            <a
              href="https://www.onlinegdb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-xs"
              aria-label="Open OnlineGDB in a new tab"
            >
              <span>Powered by OnlineGDB</span>
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineGDBEditor;
