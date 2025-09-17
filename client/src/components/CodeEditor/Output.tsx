import { useEffect, useState, useCallback } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { executeCode } from "./api";
import type * as monaco from "monaco-editor";

// Define props interface
interface OutputProps {
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  language: string;
}

const Output: React.FC<OutputProps> = ({ editorRef, language }) => {
  const [stdout, setStdout] = useState<string[] | null>(null);
  const [stderr, setStderr] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

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
      const { run: result } = await executeCode(language, sourceCode);
      const out = (result?.output ?? "").toString();
      const err = (result?.stderr ?? "").toString();
      setStdout(out ? out.split("\n") : null);
      setStderr(err ? err.split("\n") : null);
      setIsError(!!err);
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
    <Box w="50%">
      <Text mb={2} fontSize="lg">Output</Text>
      <Flex gap={2} mb={4}>
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
      </Flex>
      <Box
        height="75vh"
        p={2}
        color={isError ? "red.400" : undefined}
        border="1px solid"
        borderRadius={4}
        borderColor={isError ? "red.500" : "#333"}
        overflowY="auto"
      >
        {stdout?.map((line, i) => (
          <Text key={`out-${i}`}>{line}</Text>
        ))}
        {stderr && stderr.length > 0 && (
          <Box mt={stdout ? 3 : 0}>
            <Text fontWeight="bold" color="red.400" mb={1}>Errors</Text>
            {stderr.map((line, i) => (
              <Text key={`err-${i}`} color="red.400">{line}</Text>
            ))}
          </Box>
        )}
        {!stdout && !stderr && 'Click "Run Code" (or press Ctrl/Cmd+Enter) to see the output here'}
      </Box>
    </Box>
  );
};

export default Output;
