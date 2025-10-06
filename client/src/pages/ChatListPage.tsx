import React, { useEffect, useState } from 'react';
import { listThreads, type ChatThread } from '@/services/chat';
import { Link } from 'react-router-dom';

const ChatListPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listThreads();
        if (!mounted) return;
        setThreads(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load chats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Chats</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-2">
          {threads.length === 0 && (
            <div className="text-gray-500">No chats yet.</div>
          )}
          {threads.map((t) => (
            <Link key={t.threadId} to={`/chat/${t.threadId}`} className="block p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold">
                  {(t.otherUser?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{t.otherUser?.username}</div>
                  {t.lastMessage && (
                    <div className="text-sm text-gray-500 truncate">{t.lastMessage.text}</div>
                  )}
                </div>
                {typeof t.unread === 'number' && t.unread > 0 && (
                  <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{t.unread}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatListPage;
