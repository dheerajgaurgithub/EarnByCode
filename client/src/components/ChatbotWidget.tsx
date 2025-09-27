import React from 'react';
import { Bot, Send, X, Square } from 'lucide-react';
import config from '@/lib/config';

// Reusable global chatbot widget for site-scoped Q&A
// - Responsive, floating bottom-right
// - Excludes problem-detail and contest pages by mounting conditions in App
// - Uses improved matching and backend logging

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Remove any code blocks or inline code formatting
function stripCode(text: string): string {
  if (!text) return '';
  // Remove fenced code blocks ``` ... ```
  let out = text.replace(/```[\s\S]*?```/g, '');
  // Remove inline code `...`
  out = out.replace(/`[^`]+`/g, (m) => m.replace(/`/g, ''));
  // Collapse excessive newlines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

// Hint configuration
const HINT_LOCALSTORAGE_KEY = 'ai_widget_hint_seen';
const HINT_DURATION_MS = 5000; // adjust as needed
const HINT_MESSAGE = 'Press Shift + A (or Alt + A)';

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s/.-]+/g, ' ').replace(/\s+/g, ' ').trim();

const getApiBase = () => {
  const raw = (import.meta as any)?.env?.VITE_API_URL as string;
  const base = raw || 'https://algobucks.onrender.com/api';
  return base.replace(/\/$/, '');
};
// KB removed; using AI backend

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful AI assistant for the AlgoBucks web app. Answer questions about this site and general coding concepts, but NEVER include code, pseudo-code, or fenced code blocks. Provide plain-language explanations only.' },
    { role: 'assistant', content: 'Hi! I can help with AlgoBucks pages, features, submissions, contests, and general coding concepts. Ask me anything (no code snippets will be provided).' },
  ]);
  const [loading, setLoading] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const [showHint, setShowHint] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Keyboard shortcuts: Shift+A or Alt+A to toggle; Ctrl+J to focus input when open. Ignore when typing in inputs.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (isTyping) return;
      const k = e.key;
      if ((e.shiftKey && (k === 'A' || k === 'a')) || (e.altKey && (k === 'A' || k === 'a'))) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.ctrlKey && (k === 'J' || k === 'j')) {
        if (open) {
          e.preventDefault();
          try { inputRef.current?.focus(); } catch {}
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // First-visit hint: show a subtle tooltip for Shift+A
  React.useEffect(() => {
    try {
      const key = HINT_LOCALSTORAGE_KEY;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setShowHint(true);
        const t = setTimeout(() => {
          setShowHint(false);
          localStorage.setItem(key, '1');
        }, HINT_DURATION_MS);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Allow re-showing the hint on demand:
  // - window.dispatchEvent(new Event('ai-widget:hint'))
  // - or call (window as any).aiWidgetShowHint?.()
  React.useEffect(() => {
    const show = () => {
      try { localStorage.removeItem(HINT_LOCALSTORAGE_KEY); } catch {}
      setShowHint(true);
      const t = setTimeout(() => {
        setShowHint(false);
        try { localStorage.setItem(HINT_LOCALSTORAGE_KEY, '1'); } catch {}
      }, HINT_DURATION_MS);
      return t;
    };
    const onEvt = () => { show(); };
    window.addEventListener('ai-widget:hint', onEvt as EventListener);
    (window as any).aiWidgetShowHint = () => { show(); };
    return () => {
      window.removeEventListener('ai-widget:hint', onEvt as EventListener);
      try { delete (window as any).aiWidgetShowHint; } catch {}
    };
  }, []);

  const quick = React.useMemo(() => [
    'Where are the problems?',
    'How do I see my submissions?',
    'How to join contests?',
    'How to contact support?',
  ], []);

  const logFaqToBackend = async (q: string) => {
    try {
      await fetch(`${getApiBase()}/analytics/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        credentials: 'include',
      });
    } catch {}
  };

  const send = async (qRaw?: string) => {
    const q = (qRaw ?? input).trim();
    if (!q || loading) return;
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setInput('');
    setLoading(true);
    logFaqToBackend(normalize(q));

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`${config.api.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: next, stream: true }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `HTTP ${res.status}`);
      }
      let acc = '';
      setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(/\n/);
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload);
            const piece = obj?.choices?.[0]?.delta?.content || obj?.choices?.[0]?.message?.content || '';
            if (piece) {
              acc += piece;
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                    (last as ChatMessage).content = stripCode(acc);
                }
                return copy as ChatMessage[];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: stripCode(`Error: ${e?.message || e}`) }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    try { abortRef.current?.abort(); } catch {}
  };

  return (
    <div className="fixed z-40 right-3 bottom-3">
      {!open && (
        <div className="relative">
          {showHint && (
            <div className="absolute -top-11 right-0 bg-black/80 text-white text-[11px] px-2 py-1 rounded shadow-md select-none">
              {HINT_MESSAGE}
              <button
                onClick={() => {
                  setShowHint(false);
                  try { localStorage.setItem(HINT_LOCALSTORAGE_KEY, '1'); } catch {}
                }}
                className="ml-2 text-white/70 hover:text-white"
                aria-label="Dismiss hint"
              >
                ×
              </button>
              <div className="absolute -bottom-1 right-3 w-2 h-2 bg-black/80 rotate-45"></div>
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="h-11 w-11 bg-sky-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Open assistant"
            title="Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
        </div>
      )}
      {open && (
        <div className="w-[92vw] max-w-[17rem] sm:w-[90vw] sm:max-w-sm bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-2.5 py-2 bg-sky-50 dark:bg-gray-800 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-600 dark:text-green-400" />
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-green-300 dark:hover:text-green-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-2.5 py-2 flex flex-wrap gap-1.5 border-b border-sky-200 dark:border-green-800 bg-white dark:bg-gray-900">
            {quick.map((s, idx) => (
              <button
                key={idx}
                onClick={() => send(s)}
                className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-300"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="h-44 sm:h-56 overflow-y-auto px-2.5 py-2.5 space-y-2">
            {messages.filter(m => m.role !== 'system').map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block max-w-[85%] px-2 py-1.5 rounded-xl text-[12px] ${m.role === 'user' ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-green-200 rounded-bl-sm'}`}>
                  <span>{stripCode(m.content)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-sky-200 dark:border-green-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask something..."
              ref={inputRef}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-sky-200 dark:border-green-800 text-[12px] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {loading ? (
              <button onClick={stop} className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[13px] inline-flex items-center gap-1">
                <Square className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button onClick={() => send()} className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[13px] inline-flex items-center gap-1" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-gray-800 text-[10px] text-slate-500 dark:text-green-300 border-t border-sky-200 dark:border-green-800">
            Answers are based only on AlgoBucks content. For more help see /help or /contact.
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
