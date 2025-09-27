import React from 'react';
import config from '@/lib/config';

// Minimal markdown rendering for code blocks and inline code
function renderMarkdown(text: string) {
  // Simple replacements; for full markdown consider a library like marked/react-markdown
  const withCodeBlocks = text
    .replace(/```([\s\S]*?)```/g, (_m, p1) => `\n<pre class="bg-gray-900 text-green-200 p-3 rounded-md overflow-auto text-xs"><code>${
      String(p1).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c])
    }</code></pre>\n`)
    .replace(/`([^`]+)`/g, (_m, p1) => `<code class="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5 text-[0.85em]">${
      String(p1).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c])
    }</code>`);
  const withParagraphs = withCodeBlocks
    .split(/\n{2,}/)
    .map((para) => `<p class="mb-3 leading-7">${para}</p>`) // keep single newlines inside paragraphs
    .join('\n');
  return { __html: withParagraphs };
}

const DEFAULT_MODEL = 'gpt-4o-mini';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'system' as const, content: 'You are a helpful coding assistant.' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [model, setModel] = React.useState<string>(DEFAULT_MODEL);
  const [streaming, setStreaming] = React.useState(true);
  const abortRef = React.useRef<AbortController | null>(null);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    if (!streaming) {
      try {
        const res = await fetch(`${config.api.baseUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ messages: nextMessages, model, stream: false })
        });
        const data = await res.json();
        const content = data?.content || (data?.message ? `Error: ${data.message}` : '');
        setMessages((prev) => [...prev, { role: 'assistant' as const, content } as ChatMessage]);
      } catch (e: any) {
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: `Error: ${e?.message || e}` } as ChatMessage]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Streaming via SSE
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`${config.api.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: nextMessages, model, stream: true }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `HTTP ${res.status}`);
      }

      let acc = '';
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: '' } as ChatMessage]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // OpenAI SSE uses lines like "data: {json}\n\n"
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
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1] as ChatMessage | undefined;
                if (last && last.role === 'assistant') {
                  last.content = acc;
                }
                return copy;
              });
            }
          } catch {
            // ignore non-JSON lines
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e?.message || e}` }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    try { abortRef.current?.abort(); } catch {}
  };

  const clear = () => {
    setMessages([{ role: 'system', content: 'You are a helpful coding assistant.' }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-3">AI Assistant</h1>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
        </select>
        <label className="text-sm ml-3">Streaming</label>
        <input type="checkbox" checked={streaming} onChange={(e) => setStreaming(e.target.checked)} />
        <button
          onClick={clear}
          className="ml-auto text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      </div>

      <div className="border rounded-md p-3 bg-white dark:bg-gray-900">
        <div className="space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={
              m.role === 'user' ? 'text-gray-900 dark:text-gray-100' : m.role === 'assistant' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
            }>
              <div className="text-xs font-semibold mb-1 opacity-70">
                {m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Assistant' : 'System'}
              </div>
              {m.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={renderMarkdown(m.content)} />
              ) : (
                <pre className="whitespace-pre-wrap leading-7">{m.content}</pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          rows={3}
          className="flex-1 border rounded-md p-2 bg-white dark:bg-gray-900"
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          {loading && (
            <button onClick={stop} className="px-4 py-2 border rounded-md">Stop</button>
          )}
        </div>
      </div>
    </div>
  );
}
