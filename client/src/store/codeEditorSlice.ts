import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Lang = "Java" | "Cpp" | "Python";

export interface TestCase {
  input: string;
  expected: string;
  output?: string;
  passed?: boolean;
  runtimeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export interface CodeEditorState {
  // Language and code
  lang: Lang;
  code: string;
  codeByLang: Record<Lang, string>;

  // Input/Output
  input: string;
  output: string;
  expected: string;
  passed: boolean | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;

  // Execution state
  running: boolean;
  compilerLog: string;
  showLog: boolean;
  stdoutText: string;
  stderrText: string;

  // Settings
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  darkMode: boolean;
  selectedTcIndex: number;

  // Test cases
  testcases: TestCase[];

  // Problem context
  problemId: string | null;

  // Execution metadata
  lastExecMeta: string;
}

const DEFAULT_SNIPPETS: Record<Lang, string> = {
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}`,
  Cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello C++" << endl;\n  return 0;\n}`,
  Python: `print('Hello Python')`,
};

const initialState: CodeEditorState = {
  lang: "Java",
  code: DEFAULT_SNIPPETS.Java,
  codeByLang: {
    Java: DEFAULT_SNIPPETS.Java,
    Cpp: DEFAULT_SNIPPETS.Cpp,
    Python: DEFAULT_SNIPPETS.Python,
  },
  input: "",
  output: "",
  expected: "",
  passed: null,
  runtimeMs: null,
  memoryKb: null,
  exitCode: null,
  running: false,
  compilerLog: "",
  showLog: false,
  stdoutText: "",
  stderrText: "",
  ignoreWhitespace: true,
  ignoreCase: false,
  darkMode: true,
  selectedTcIndex: 0,
  testcases: [{ input: "", expected: "" }],
  problemId: null,
  lastExecMeta: "",
};

export const codeEditorSlice = createSlice({
  name: 'codeEditor',
  initialState,
  reducers: {
    // Language management
    setLanguage: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload;
      state.code = state.codeByLang[action.payload] || DEFAULT_SNIPPETS[action.payload];
    },

    // Code management
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
      state.codeByLang[state.lang] = action.payload;
    },

    setCodeByLang: (state, action: PayloadAction<Record<Lang, string>>) => {
      state.codeByLang = action.payload;
    },

    // Input/Output management
    setInput: (state, action: PayloadAction<string>) => {
      state.input = action.payload;
    },

    setOutput: (state, action: PayloadAction<string>) => {
      state.output = action.payload;
    },

    setExpected: (state, action: PayloadAction<string>) => {
      state.expected = action.payload;
    },

    setPassed: (state, action: PayloadAction<boolean | null>) => {
      state.passed = action.payload;
    },

    setRuntimeMs: (state, action: PayloadAction<number | null>) => {
      state.runtimeMs = action.payload;
    },

    setMemoryKb: (state, action: PayloadAction<number | null>) => {
      state.memoryKb = action.payload;
    },

    setExitCode: (state, action: PayloadAction<number | null>) => {
      state.exitCode = action.payload;
    },

    // Execution state
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.running = action.payload;
    },

    setCompilerLog: (state, action: PayloadAction<string>) => {
      state.compilerLog = action.payload;
    },

    setShowLog: (state, action: PayloadAction<boolean>) => {
      state.showLog = action.payload;
    },

    setStdoutText: (state, action: PayloadAction<string>) => {
      state.stdoutText = action.payload;
    },

    setStderrText: (state, action: PayloadAction<string>) => {
      state.stderrText = action.payload;
    },

    // Settings
    setIgnoreWhitespace: (state, action: PayloadAction<boolean>) => {
      state.ignoreWhitespace = action.payload;
    },

    setIgnoreCase: (state, action: PayloadAction<boolean>) => {
      state.ignoreCase = action.payload;
    },

    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },

    setSelectedTcIndex: (state, action: PayloadAction<number>) => {
      state.selectedTcIndex = action.payload;
    },

    // Test cases management
    setTestcases: (state, action: PayloadAction<TestCase[]>) => {
      state.testcases = action.payload;
    },

    updateTestcase: (state, action: PayloadAction<{ index: number; testcase: Partial<TestCase> }>) => {
      const { index, testcase } = action.payload;
      if (state.testcases[index]) {
        state.testcases[index] = { ...state.testcases[index], ...testcase };
      }
    },

    addTestcase: (state) => {
      state.testcases.push({ input: "", expected: "" });
    },

    removeTestcase: (state, action: PayloadAction<number>) => {
      state.testcases.splice(action.payload, 1);
    },

    resetTestcases: (state) => {
      state.testcases = [{ input: "", expected: "" }];
    },

    // Problem context
    setProblemId: (state, action: PayloadAction<string | null>) => {
      state.problemId = action.payload;
    },

    // Execution metadata
    setLastExecMeta: (state, action: PayloadAction<string>) => {
      state.lastExecMeta = action.payload;
    },

    // Bulk state updates for performance
    updateExecutionState: (state, action: PayloadAction<{
      output?: string;
      passed?: boolean | null;
      runtimeMs?: number | null;
      memoryKb?: number | null;
      exitCode?: number | null;
      stdoutText?: string;
      stderrText?: string;
      compilerLog?: string;
    }>) => {
      const updates = action.payload;
      if (updates.output !== undefined) state.output = updates.output;
      if (updates.passed !== undefined) state.passed = updates.passed;
      if (updates.runtimeMs !== undefined) state.runtimeMs = updates.runtimeMs;
      if (updates.memoryKb !== undefined) state.memoryKb = updates.memoryKb;
      if (updates.exitCode !== undefined) state.exitCode = updates.exitCode;
      if (updates.stdoutText !== undefined) state.stdoutText = updates.stdoutText;
      if (updates.stderrText !== undefined) state.stderrText = updates.stderrText;
      if (updates.compilerLog !== undefined) state.compilerLog = updates.compilerLog;
    },

    // Reset execution state
    resetExecutionState: (state) => {
      state.output = "";
      state.passed = null;
      state.runtimeMs = null;
      state.memoryKb = null;
      state.exitCode = null;
      state.stdoutText = "";
      state.stderrText = "";
      state.compilerLog = "";
      state.showLog = false;
      state.running = false;
    },

    // Reset testcase results
    resetTestcaseResults: (state) => {
      state.testcases = state.testcases.map(tc => ({
        ...tc,
        output: undefined,
        passed: undefined,
        runtimeMs: undefined,
        memoryKb: undefined,
        exitCode: undefined,
      }));
    },

    // Load state from localStorage
    loadFromLocalStorage: (state, action: PayloadAction<{ darkMode?: boolean; codeByLang?: Record<Lang, string> }>) => {
      const { darkMode, codeByLang } = action.payload;
      if (darkMode !== undefined) state.darkMode = darkMode;
      if (codeByLang) state.codeByLang = codeByLang;
    },
  },
});

export const {
  setLanguage,
  setCode,
  setCodeByLang,
  setInput,
  setOutput,
  setExpected,
  setPassed,
  setRuntimeMs,
  setMemoryKb,
  setExitCode,
  setRunning,
  setCompilerLog,
  setShowLog,
  setStdoutText,
  setStderrText,
  setIgnoreWhitespace,
  setIgnoreCase,
  setDarkMode,
  setSelectedTcIndex,
  setTestcases,
  updateTestcase,
  addTestcase,
  removeTestcase,
  resetTestcases,
  setProblemId,
  setLastExecMeta,
  updateExecutionState,
  resetExecutionState,
  resetTestcaseResults,
  loadFromLocalStorage,
} = codeEditorSlice.actions;

export const codeEditorReducer = codeEditorSlice.reducer;
