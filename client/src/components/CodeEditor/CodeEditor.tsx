import { useEffect, useRef, useState, useCallback } from "react";
// Using plain HTML elements to avoid ChakraProvider dependency
import { Editor, OnMount } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "./constants";
import Output from "./Output";

// Type for editorRef
import type * as monaco from "monaco-editor";

const CodeEditor = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const storageKey = useCallback((lang: string) => `algobucks:editor:code:${lang}`, []);

  const onSelect = (lang: string) => {
    setLanguage(lang);
    // Load saved code for this language or default snippet if not present
    const saved = localStorage.getItem(storageKey(lang));
    setValue(saved ?? CODE_SNIPPETS[lang] ?? "");
  };

  // Persist code per language
  const handleChange = (next?: string) => {
    const text = next ?? "";
    setValue(text);
    localStorage.setItem(storageKey(language), text);
  };

  // Initialize from saved code or default snippet
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(language));
    setValue(saved ?? CODE_SNIPPETS[language] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl+Enter to run: dispatch a custom event handled by Output
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("algobucks-code-editor-run"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset to template for current language
  const resetToTemplate = () => {
    const tpl = CODE_SNIPPETS[language] ?? "";
    setValue(tpl);
    localStorage.setItem(storageKey(language), tpl);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: '50%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <LanguageSelector language={language} onSelect={onSelect} />
            <button
              onClick={resetToTemplate}
              style={{ padding: '6px 10px', border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', borderRadius: 6, cursor: 'pointer' }}
            >
              Reset to Template
            </button>
          </div>
          <Editor
            options={{
              minimap: {
                enabled: false,
              },
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            defaultValue={CODE_SNIPPETS[language]}
            onMount={onMount}
            value={value}
            onChange={handleChange}
          />
        </div>
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
};

export default CodeEditor;
