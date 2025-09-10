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

  return (
    <div className="h-full w-full overflow-hidden rounded-md">
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
    </div>
  );
};

export default CodeEditor;
