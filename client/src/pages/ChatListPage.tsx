import React, { useEffect, useState } from 'react';
import { listThreads, type ChatThread } from '@/services/chat';
import { Link, useLocation } from 'react-router-dom';
import { getSocket, watchPresence, startPresence } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';

const ChatListPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { user } = useAuth();

  const formatLastSeen = (iso?: string | null) => {
    if (!iso) return 'Offline';
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
    } catch {
      return 'Offline';
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listThreads();
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : [];
        setThreads(arr);
        // realtime presence
        try {
          const myId = (user as any)?.id || (user as any)?._id || undefined;
          startPresence(myId);
          const ids = arr.map(t => (t.otherUser?.id ? String(t.otherUser.id) : '')).filter(Boolean);
          if (ids.length) watchPresence(ids);
          const s = getSocket();
          const onPresence = (p: { userId: string; online: boolean; lastSeen: string | null }) => {
            setThreads(prev => prev.map(t => (String(t.otherUser?.id) === String(p.userId) ? { ...t, otherUserIsOnline: p.online, otherUserLastSeen: p.lastSeen } : t)));
          };
          s.on('presence:update', onPresence);
          return () => { try { s.off('presence:update', onPresence); } catch {} };
        } catch {}
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
    <aside className="w-full sm:w-72 md:w-80 lg:w-80 border-r bg-white dark:bg-gray-900">
      <div className="px-3 py-3 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {loading && <div className="text-sm text-gray-500 px-2 py-1">Loading...</div>}
        {error && <div className="text-sm text-red-600 px-2 py-1">{error}</div>}
        {!loading && !error && threads.length === 0 && (
          <div className="text-sm text-gray-500 px-2 py-1">No chats yet.</div>
        )}
        {!loading && !error && threads.map((t) => {
          const active = location.pathname.endsWith(`/${t.threadId}`);
          return (
            <Link
              key={t.threadId}
              to={`/chat/${t.threadId}`}
              className={`block px-3 py-2 rounded-md border ${active ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold">
                  {t.otherUser?.avatarUrl ? (
                    <img src={t.otherUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    (t.otherUser?.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.otherUser?.fullName || t.otherUser?.username}</div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${t.otherUserIsOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {t.otherUserIsOnline ? 'Online' : (t.otherUserLastSeen ? `Last seen ${formatLastSeen(t.otherUserLastSeen)}` : 'Offline')}
                  </div>
                  {t.lastMessage && (
                    <div className="text-xs text-gray-500 truncate">{t.lastMessage.text}</div>
                  )}
                </div>
                {typeof t.unread === 'number' && t.unread > 0 && (
                  <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{t.unread}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
;

export default ChatListPage;
