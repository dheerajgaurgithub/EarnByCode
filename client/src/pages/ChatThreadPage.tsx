import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, type ChatMessage } from '@/services/chat';
import { useAuth } from '@/context/AuthContext';

const ChatThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const myId = (user as any)?.id || (user as any)?._id || (user as any)?.username || 'me';

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
        try { window.dispatchEvent(new CustomEvent('chat:updated')); } catch {}
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
      setMessages(prev => [...prev, { id: res.id, text: t, threadId, fromUserId: String(myId || 'me'), createdAt: new Date().toISOString() }]);
      setTimeout(scrollToBottom, 30);
      try { window.dispatchEvent(new CustomEvent('chat:updated')); } catch {}
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
        {messages.map((m) => {
          const isMine = m.fromUserId === myId || m.fromUserId === 'me';
          return (
            <div key={m.id} className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%]`}>
                <div className={`px-3 py-2 rounded-2xl ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-200 text-black rounded-bl-sm'} whitespace-pre-wrap`}>{m.text}</div>
                <div className={`mt-1 text-[10px] ${isMine ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
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
