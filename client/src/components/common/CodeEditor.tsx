import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
  options?: Record<string, any>;
}

const CodeEditor = ({
  value,
  onChange,
  language = 'javascript',
  height = '500px',
  readOnly = false,
  theme = 'vs-dark',
  options = {},
}: CodeEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  // OnlineGDB embed toggle (default ON per request)
  const [useOnlineGDB, setUseOnlineGDB] = useState<boolean>(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const mapToOnlineGdbUrl = (lang: string) => {
    const key = String(lang || '').toLowerCase();
    if (key.includes('cpp') || key === 'c++' || key === 'cpp') return 'https://www.onlinegdb.com/online_cpp_compiler';
    if (key.includes('java')) return 'https://www.onlinegdb.com/online_java_compiler';
    if (key.includes('python') || key === 'py') return 'https://www.onlinegdb.com/online_python_compiler';
    if (key.includes('javascript') || key === 'js') return 'https://www.onlinegdb.com/online_javascript_editor';
    if (key.includes('c#') || key.includes('csharp')) return 'https://www.onlinegdb.com/online_csharp_compiler';
    if (key.includes('c ')) return 'https://www.onlinegdb.com/online_c_compiler';
    return 'https://www.onlinegdb.com/';
  };

  const openOnlineGdbExternal = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value || '');
      }
    } catch {}
    const href = mapToOnlineGdbUrl(language);
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-md relative">
      {/* Toggle in top-right */}
      <label className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-[11px] flex items-center gap-1 shadow-sm">
        <input
          type="checkbox"
          checked={useOnlineGDB}
          onChange={(e) => setUseOnlineGDB(e.target.checked)}
        />
        <span>OnlineGDB</span>
      </label>

      {useOnlineGDB ? (
        <div className="h-full w-full">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] bg-sky-50 dark:bg-gray-800 border-b border-sky-100 dark:border-gray-700">
            <span className="text-sky-700 dark:text-sky-300">OnlineGDB is embedded. Some browsers may block it.</span>
            <button
              type="button"
              onClick={openOnlineGdbExternal}
              className="px-2 py-1 rounded-md border border-sky-200 dark:border-gray-600 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-gray-700"
              title="Open in OnlineGDB (code copied to clipboard)"
            >
              Open in OnlineGDB
            </button>
          </div>
          <iframe
            key={String(language).toLowerCase()}
            title="OnlineGDB"
            src={mapToOnlineGdbUrl(language)}
            className="w-full h-[500px] bg-white"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals allow-same-origin"
          />
        </div>
      ) : (
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          theme={theme}
          value={value}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly,
            ...options,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        />
      )}
    </div>
  );
};

export default CodeEditor;
