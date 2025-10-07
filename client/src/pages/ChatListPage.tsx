import React, { useEffect, useState } from 'react';
import { listThreads } from '@/services/chat';
import { Link, useLocation } from 'react-router-dom';
import { getSocket, watchPresence, startPresence } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { chatThreadsActions, chatThreadsSelectors } from '@/store/chatThreadsSlice';

const ChatListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const threads = useAppSelector(chatThreadsSelectors.selectAll);
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
        const arr = (Array.isArray(data) ? data : []).map((t: any) => ({ ...t, id: t.threadId }));
        dispatch(chatThreadsActions.setAll(arr));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load chats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Start presence as soon as we know the user
  useEffect(() => {
    const myId = (user as any)?.id || (user as any)?._id || undefined;
    if (!myId) return;
    try { startPresence(myId); } catch {}
  }, [user]);

  // Watch presence for loaded threads and attach one listener
  useEffect(() => {
    if (!threads.length) return;
    try {
      const ids = threads.map(t => (t.otherUser?.id ? String(t.otherUser.id) : '')).filter(Boolean);
      if (ids.length) watchPresence(ids);
      const s = getSocket();
      const onPresence = (p: { userId: string; online: boolean; lastSeen: string | null }) => {
        dispatch(chatThreadsActions.setOtherPresence(p));
      };
      const onThreadUpdate = (u: { threadId: string; lastMessage: { id: string; text: string; createdAt: string } }) => {
        dispatch(chatThreadsActions.lastMessageUpdated(u));
      };
      s.on('presence:update', onPresence);
      s.on('chat:thread:update', onThreadUpdate);
      return () => { try { s.off('presence:update', onPresence); s.off('chat:thread:update', onThreadUpdate); } catch {} };
    } catch {}
  }, [threads.length]);

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
                    <div className={`text-xs truncate ${t.unread && t.unread > 0 ? 'text-black dark:text-white font-semibold' : 'text-gray-500'}`}>
                      {t.lastMessage.text}{t.unread && t.unread > 1 ? ` • ${t.unread}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {t.blockedByMe && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Blocked</span>
                  )}
                  {typeof t.unread === 'number' && t.unread > 0 && (
                    <span className="text-xs bg-green-700 text-white rounded-full px-2 py-0.5">{t.unread}</span>
                  )}
                </div>
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
