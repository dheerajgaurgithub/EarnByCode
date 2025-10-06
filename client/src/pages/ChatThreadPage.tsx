import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, type ChatMessage } from '@/services/chat';

const ChatThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    try { listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!threadId) return;
      try {
        setLoading(true);
        const data = await getMessages(threadId, undefined, 50);
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : []);
        setTimeout(scrollToBottom, 50);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load messages');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [threadId]);

  const onSend = async () => {
    if (!threadId || !text.trim()) return;
    const t = text.trim();
    setText('');
    try {
      const res = await sendMessage(threadId, t);
      setMessages(prev => [...prev, { id: res.id, text: t, threadId, fromUserId: 'me', createdAt: new Date().toISOString() }]);
      setTimeout(scrollToBottom, 30);
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-3">Chat</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div ref={listRef} className="border rounded p-3 h-[60vh] overflow-auto bg-white dark:bg-gray-900">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
            <div className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 inline-block mt-1">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={onSend} disabled={!text.trim()}>Send</button>
      </div>
    </div>
  );
};

export default ChatThreadPage;
