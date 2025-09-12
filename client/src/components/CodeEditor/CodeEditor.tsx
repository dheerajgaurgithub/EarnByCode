import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw, Settings } from "lucide-react";
import type * as monaco from "monaco-editor";

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  code,
  onChange,
  onRun,
  onReset,
  className = '',
  style = {},
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) => {
    editorRef.current = editor;
  };

  const languageMap: { [key: string]: string } = {
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 gap-2 sm:gap-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="text-gray-900 font-medium text-sm sm:text-base">Code Editor</span>
          <span className="text-gray-500 text-xs sm:text-sm capitalize px-2 py-1 bg-gray-100 rounded">
            {language}
          </span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={onReset}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded"
            title="Reset code"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>

          <button
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded"
            title="Settings"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>

          <button
            onClick={onRun}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs sm:text-sm font-medium transition-colors"
          >
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Run Code</span>
            <span className="xs:hidden">Run</span>
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative">
        <Editor
          height="350px"
          language={languageMap[language]}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          theme="light"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbers: "on",
            renderWhitespace: "selection",
            folding: true,
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            lineHeight: 1.5,
            renderLineHighlight: "all",
            selectionHighlight: false,
            occurrencesHighlight: "off",
            codeLens: false,
            contextmenu: false,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: "off",
            tabCompletion: "off",
            wordBasedSuggestions: "off",
            // Responsive font size
            ...(typeof window !== 'undefined' && window.innerWidth < 640 && {
              fontSize: 12,
              lineHeight: 1.4,
            }),
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
            {language.toUpperCase()}
          </span>
          <span className="hidden sm:inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
            {code.length} chars
          </span>
          <span className="hidden md:inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>
            {code.split('\n').length} lines
          </span>
        </div>
        <div className="text-xs">
          {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Mobile optimization styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .monaco-editor {
            font-size: 12px !important;
          }
          .monaco-editor .margin {
            width: 50px !important;
          }
        }
        
        @media (max-width: 480px) {
          .monaco-editor {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
};