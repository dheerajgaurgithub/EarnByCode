import { useEffect, useState, useCallback } from "react";
import { executeCode } from "./api";
import type * as monaco from "monaco-editor";

// Define props interface
interface OutputProps {
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  language: string;
}

const Output: React.FC<OutputProps> = ({ editorRef, language }) => {
  const [stdin, setStdin] = useState<string>("");
  const [expected, setExpected] = useState<string>("");
  const [stdout, setStdout] = useState<string[] | null>(null);
  const [stderr, setStderr] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [didMatch, setDidMatch] = useState<boolean | null>(null);

  const runCode = useCallback(async () => {
    const sourceCode = editorRef.current?.getValue() ?? "";
    if (!sourceCode.trim()) {
      window.alert("Nothing to run: the editor is empty.");
      return;
    }

    try {
      setIsLoading(true);
      setStdout(null);
      setStderr(null);
      const { run: result } = await executeCode(language, sourceCode, stdin);
      const out = (result?.output ?? "").toString();
      const err = (result?.stderr ?? "").toString();
      setStdout(out ? out.split("\n") : null);
      setStderr(err ? err.split("\n") : null);
      setIsError(!!err);
      if (expected.trim().length > 0) {
        const normalize = (s: string) => s.replace(/\r\n/g, "\n").trim();
        setDidMatch(normalize(out) === normalize(expected));
      } else {
        setDidMatch(null);
      }
    } catch (error: any) {
      console.error(error);
      window.alert(`Execution error: ${error?.message || "Unable to run code"}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [editorRef, language]);

  // Listen to global run event dispatched by CodeEditor (Ctrl/Cmd + Enter)
  useEffect(() => {
    const handler = () => runCode();
    window.addEventListener("algobucks-code-editor-run", handler as EventListener);
    return () => window.removeEventListener("algobucks-code-editor-run", handler as EventListener);
  }, [runCode]);

  const clearOutput = () => {
    setStdout(null);
    setStderr(null);
    setIsError(false);
  };

  return (
    <div style={{ width: '50%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button
          onClick={runCode}
          disabled={isLoading}
          style={{
            padding: '6px 10px',
            border: '1px solid #16a34a',
            color: '#16a34a',
            background: 'transparent',
            borderRadius: 6,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Running…' : 'Run Code'}
        </button>
        <button
          onClick={clearOutput}
          disabled={!stdout && !stderr}
          style={{
            padding: '6px 10px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            borderRadius: 6,
            cursor: !stdout && !stderr ? 'not-allowed' : 'pointer'
          }}
        >
          Clear
        </button>
        {didMatch !== null && (
          <span style={{
            padding: '2px 8px',
            borderRadius: 12,
            background: didMatch ? '#064e3b' : '#7f1d1d',
            color: '#ecfdf5'
          }}>
            {didMatch ? 'Passed' : 'Failed'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 4, color: '#94a3b8' }}>Custom Input (stdin)</div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input lines for your program"
            style={{ width: '100%', height: 120, background: '#0b1020', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 4, color: '#94a3b8' }}>Expected Output (optional)</div>
          <textarea
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="Paste expected output here to compare"
            style={{ width: '100%', height: 120, background: '#0b1020', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 8 }}
          />
        </div>
      </div>

      <div
        style={{
          height: '75vh',
          padding: 8,
          color: isError ? '#fca5a5' : undefined,
          border: '1px solid',
          borderRadius: 4,
          borderColor: isError ? '#ef4444' : '#333',
          overflowY: 'auto'
        }}
      >
        {stdout?.map((line, i) => (
          <div key={`out-${i}`}>{line}</div>
        ))}
        {stderr && stderr.length > 0 && (
          <div style={{ marginTop: stdout ? 12 : 0 }}>
            <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>Errors</div>
            {stderr.map((line, i) => (
              <div key={`err-${i}`} style={{ color: '#fca5a5' }}>{line}</div>
            ))}
          </div>
        )}
        {!stdout && !stderr && 'Click "Run Code" (or press Ctrl/Cmd+Enter) to see the output here'}
      </div>
    </div>
  );
}

export default Output;
