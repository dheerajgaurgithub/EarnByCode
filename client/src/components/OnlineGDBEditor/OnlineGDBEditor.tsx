import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

export type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface OnlineGDBEditorProps {
  code: string;
  language: Language;
  onRun: (code: string, language: Language) => Promise<void>;
  onCodeChange?: (code: string, language: Language) => void;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [lastCodeUpdate, setLastCodeUpdate] = useState(Date.now());

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsInitialized(true);
    setIsReloading(false);
    setError(null);
    
    // Set up message listener for code changes
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current?.contentWindow || event.source !== iframeRef.current.contentWindow) return;
      
      if (event.data?.type === 'codeChange' && onCodeChange) {
        onCodeChange(event.data.code, currentLanguage);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Inject code into the editor after a short delay to ensure it's ready
    const timer = setTimeout(() => {
      if (initialCode && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'setCode',
          code: initialCode,
          language: languageMap[currentLanguage]
        }, '*');
        
        // Set up code execution handler
        iframeRef.current.contentWindow.postMessage({
          type: 'setRunHandler',
          handler: 'runCode'
        }, '*');
      }
    }, 2000); // Increased delay to ensure editor is fully loaded
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [initialCode, currentLanguage, onCodeChange]);
  
  // Handle run button click
  const handleRun = useCallback(async () => {
    const contentWindow = iframeRef.current?.contentWindow;
    if (!contentWindow) return;
    
    try {
      // Get the current code from the editor
      const code = await new Promise<string>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.source === contentWindow && event.data?.type === 'getCodeResponse') {
            window.removeEventListener('message', messageHandler);
            resolve(event.data.code);
          }
        };
        
        window.addEventListener('message', messageHandler);
        contentWindow.postMessage({ type: 'getCode' }, '*');
        
        // Timeout if no response
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          resolve('');
        }, 1000);
      });
      
      // Call the parent's onRun with the current code and language
      if (code && onRun) {
        await onRun(code, currentLanguage);
      }
    } catch (err) {
      console.error('Error running code:', err);
      setError('Failed to run code. Please try again.');
    }
  }, [onRun, currentLanguage]);

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

  // Get the URL for the current language
  const getIframeUrl = useCallback(() => {
    const lang = languageMap[currentLanguage] || 'cpp';
    // Force HTTPS and use the embed endpoint
    const url = new URL(`https://www.onlinegdb.com/online_${lang}_compiler`);
    
    // Add initial code as URL parameter if provided
    if (initialCode && !isInitialized) {
      url.searchParams.set('code', encodeURIComponent(initialCode));
    }
    
    // Add theme parameter (light/dark)
    const isDark = document.documentElement.classList.contains('dark');
    url.searchParams.set('theme', isDark ? 'dark' : 'light');
    
    // Disable menu and enable embedding
    url.searchParams.set('hideNewFileOption', 'true');
    url.searchParams.set('hideStdinTab', 'true');
    url.searchParams.set('hideResult', 'true');
    
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
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="p-1.5 rounded-md hover:bg-blue-700/30 dark:hover:bg-green-700/50 transition-colors disabled:opacity-50"
            title="Run code"
            aria-label="Run code"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-blue-700/30 dark:hover:bg-green-700/50 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0-4h-4m4 0l-5 5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900" style={{ minHeight: '300px' }}>
        {error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4">
              <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {isInitialized ? 'Connected to OnlineGDB' : 'Connecting to OnlineGDB...'}
              </p>
              <button
                onClick={handleReload}
                disabled={isReloading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center mx-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? 'animate-spin' : ''}`} />
                Reload Editor
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Having trouble? Try opening </p>
              <a
                href="https://www.onlinegdb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
              >
                OnlineGDB in a new tab
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={getIframeUrl()}
            className="w-full h-full border-0 focus:outline-none"
            title="OnlineGDB Code Editor"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-top-navigation allow-top-navigation-by-user-activation"
            allow="clipboard-read; clipboard-write; fullscreen"
            style={{ pointerEvents: 'auto' }}
            data-gramm_editor="false"
            data-gramm="false"
            data-enable-grammarly="false"
            allowFullScreen
            onError={() => setError('Failed to load the code editor. Please check your internet connection.')}
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  );
};

export default OnlineGDBEditor;
