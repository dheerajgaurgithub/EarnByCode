import React from 'react';
import { Bot, Send, X, Square, RotateCcw, Sparkles } from 'lucide-react';

// Reusable global chatbot widget for site-scoped Q&A
// Now styled as a professional sidebar interface

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function keep(text: string): string { return text || ''; }

const HINT_LOCALSTORAGE_KEY = 'ai_widget_hint_seen';
const HINT_DURATION_MS = 5000;
const HINT_MESSAGE = 'Press Shift + A (or Alt + A)';

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s/.-]+/g, ' ').replace(/\s+/g, ' ').trim();

const getApiBase = () => {
  const raw = 'https://earnbycode-mfs3.onrender.com/api';
  return raw.replace(/\/$/, '');
};

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful, safe AI assistant. Answer the user comprehensively. When appropriate, include examples and code blocks fenced with proper language hints. Be concise when asked; be detailed when needed.' },
    { role: 'assistant', content: 'Hi! I can help with AlgoBucks and general questions. Ask me anything.' },
  ]);
  const [loading, setLoading] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const [showHint, setShowHint] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [errorText, setErrorText] = React.useState<string | null>(null);

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
  }, [open]);

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
    setErrorText(null);
    logFaqToBackend(normalize(q));

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`${getApiBase()}/ai/chat`, {
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
      let gotToken = false;
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
              gotToken = true;
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                    (last as ChatMessage).content = keep(acc);
                }
                return copy as ChatMessage[];
              });
            }
          } catch {}
        }
      }
      if (!gotToken) {
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            (last as ChatMessage).content = 'Sorry, I could not generate a reply. Please try again or rephrase your question.';
          }
          return copy as ChatMessage[];
        });
        console.warn('[AI widget] No tokens received from stream. Check API key, model access, or network.');
      }
    } catch (e: any) {
      setErrorText(String(e?.message || e));
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${String(e?.message || e)}` }]);
      try { console.error('[AI widget] chat error', e); } catch {}
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    try { abortRef.current?.abort(); } catch {}
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <div className="fixed z-50 right-6 bottom-6">
          <div className="relative">
            {showHint && (
              <div className="absolute -top-14 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-xl animate-pulse">
                {HINT_MESSAGE}
                <button
                  onClick={() => {
                    setShowHint(false);
                    try { localStorage.setItem(HINT_LOCALSTORAGE_KEY, '1'); } catch {}
                  }}
                  className="ml-2 text-white/80 hover:text-white font-bold"
                  aria-label="Dismiss hint"
                >
                  ×
                </button>
                <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-purple-600 rotate-45"></div>
              </div>
            )}
            <button
              onClick={() => setOpen(true)}
              className="relative h-16 w-16 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 group"
              aria-label="Open AI Assistant"
              title="AI Assistant"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
              <Bot className="w-8 h-8 relative z-10" />
              <Sparkles className="w-4 h-4 absolute top-2 right-2 animate-pulse" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="relative px-6 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-b border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-md opacity-60"></div>
                    <div className="relative h-10 w-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">AI Assistant</h2>
                    <p className="text-purple-300 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 bg-slate-900/50 border-b border-purple-500/20">
              <div className="flex flex-wrap gap-2">
                {quick.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 text-purple-200 border border-purple-500/30 transition-all duration-200 hover:scale-105"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMessages(m => m.filter(x => x.role === 'system').concat({ role: 'assistant', content: 'Cleared chat. How can I help you now?' }));
                    setErrorText(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600/30 inline-flex items-center gap-1 transition-all duration-200"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
              {messages.filter(m => m.role !== 'system').map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center mr-2 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-br-sm shadow-lg' 
                      : 'bg-slate-800/80 text-slate-100 rounded-bl-sm border border-purple-500/20'
                  }`}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{keep(m.content)}</span>
                  </div>
                </div>
              ))}
              {errorText && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                  {errorText}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/50 border-t border-purple-500/30">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-purple-500/30">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  placeholder="Ask me anything..."
                  ref={inputRef}
                  className="flex-1 px-3 py-2 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
                />
                {loading ? (
                  <button 
                    onClick={stop} 
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg text-sm inline-flex items-center gap-2 transition-all duration-200 shadow-lg"
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                ) : (
                  <button 
                    onClick={() => send()} 
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
                    disabled={!input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-purple-300/60 mt-2 text-center">
                Powered by AI • Responses may include code & external knowledge
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ChatbotWidget;