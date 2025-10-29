import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, listThreads, type ChatThread, markThreadRead } from '@/services/chat';
import ChatListPage from './ChatListPage';
import { useAuth } from '@/context/AuthContext';
import { getSocket, watchPresence, startPresence } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { messagesActions, messagesSelectors } from '@/store/messagesSlice';
import { chatThreadsSelectors } from '@/store/chatThreadsSlice';

const ChatThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const allMsgs = useAppSelector(messagesSelectors.selectAll);
  const messages = (threadId ? allMsgs.filter(m => m.threadId === threadId) : []);
  const thread = useAppSelector(state => threadId ? chatThreadsSelectors.selectById(state as any, threadId) : undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const myId = (user as any)?.id || (user as any)?._id || (user as any)?.username || 'me';
  const [peer, setPeer] = useState<{ username: string; fullName?: string; avatarUrl?: string; id?: string } | null>(null);
  const [peerOnline, setPeerOnline] = useState<boolean | null>(null);
  const [peerLastSeen, setPeerLastSeen] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [disappearing24h, setDisappearing24h] = useState(false);

  const scrollToBottom = () => {
    try { listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  };

  // Presence via socket.io
  const formatLastSeen = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
    } catch { return ''; }
  };

  // Mark thread as read when messages are loaded
  useEffect(() => {
    if (!threadId) return;
    
    const markAsRead = async () => {
      try {
        await markThreadRead(threadId);
        // Trigger a chat update to refresh the unread count in the header
        window.dispatchEvent(new CustomEvent('chat:updated'));
      } catch (error) {
        console.error('Failed to mark thread as read:', error);
      }
    };

    markAsRead();
  }, [threadId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!threadId) return;
      try {
        setLoading(true);
        // load peer info from thread list
        try {
          const threads: ChatThread[] = await listThreads();
          const th = Array.isArray(threads) ? threads.find(t => t.threadId === threadId) : undefined;
          if (mounted && th?.otherUser) setPeer({
            username: th.otherUser.username,
            fullName: (th as any).otherUser?.fullName,
            avatarUrl: (th as any).otherUser?.avatarUrl,
            id: (th as any).otherUser?.id,
          });
          if (mounted) setIsBlocked(!!(th as any)?.blockedByMe);
        } catch {}
        const data = await getMessages(threadId, undefined, 50);
        if (!mounted) return;
        if (Array.isArray(data) && data.length) {
          dispatch(messagesActions.messagesLoaded(data.map(m => ({ id: m.id, threadId: m.threadId, fromUserId: m.fromUserId, text: m.text, createdAt: m.createdAt }))));
        }
        setTimeout(scrollToBottom, 50);
        // Mark thread as read after loading messages
        try { 
          await markThreadRead(threadId);
          window.dispatchEvent(new CustomEvent('chat:updated')); 
        } catch (e) { /* Ignore */ }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load messages');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [threadId]);

  // Watch presence for peer
  useEffect(() => {
    if (!peer?.id) return;
    try {
      startPresence((user as any)?.id || (user as any)?._id);
    } catch {}
    try {
      watchPresence([String(peer.id)]);
      const s = getSocket();
      const onPresence = (p: { userId: string; online: boolean; lastSeen: string | null }) => {
        if (String(p.userId) === String(peer.id)) {
          setPeerOnline(!!p.online);
          setPeerLastSeen(p.lastSeen || null);
        }
      };
      s.on('presence:update', onPresence);
      return () => { try { s.off('presence:update', onPresence); } catch {} };
    } catch { /* ignore */ }
  }, [peer?.id]);

  // Start presence as soon as we know current user (don't wait for peer)
  useEffect(() => {
    const my = (user as any)?.id || (user as any)?._id;
    if (!my) return;
    try { startPresence(my); } catch {}
  }, [user]);

  // Scroll on messages change
  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [messages.length]);

  // Mark thread as read after initial load and when tab regains focus
  useEffect(() => {
    if (!threadId) return;
    const mark = async () => {
      try { await markThreadRead(threadId); } catch {}
    };
    // after messages present, mark as read
    if (messages.length) mark();
    const onFocus = () => { if (messages.length) mark(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, [threadId, messages.length]);

  const onSend = async () => {
    if (!threadId || !text.trim()) return;
    const t = text.trim();
    setText('');
    try {
      const res = await sendMessage(threadId, t);
      // optimistic append; socket echo will upsert same id
      dispatch(messagesActions.messageReceived({ id: res.id, threadId, fromUserId: String(myId || 'me'), text: t, createdAt: new Date().toISOString() }));
      setTimeout(scrollToBottom, 30);
      try { window.dispatchEvent(new CustomEvent('chat:updated')); } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-0 sm:p-4">
      <div className="flex gap-0 sm:gap-4">
        {/* Left sidebar: chats */}
        <div className="hidden sm:block flex-shrink-0">
          <ChatListPage />
        </div>
        {/* Right: thread */}
        <div className="flex-1 min-w-0">
          {/* Top bar with peer info */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-white dark:bg-gray-900 rounded-t-md">
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setSettingsOpen(true)}
              title="Chat settings"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold cursor-pointer">
                {!isBlocked && peer?.avatarUrl ? (
                  <img src={peer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  'B'
                )}
              </div>
              <div className="text-left cursor-pointer">
                <div className="text-sm font-semibold">{isBlocked ? 'Blocked user' : (peer?.fullName || peer?.username || 'Chat')}</div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${peerOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {isBlocked ? 'Blocked' : (peerOnline ? 'Online' : (peerLastSeen ? `Last seen ${formatLastSeen(peerLastSeen)}` : 'Offline'))}
                </div>
              </div>
            </button>
            {peer?.username && !isBlocked && (
              <a
                href={`/u/${peer.username}`}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                title="View public profile"
              >
                View Profile
              </a>
            )}
          </div>
          {loading && <div className="p-3">Loading...</div>}
          {error && <div className="text-red-600 p-3 mb-2">{error}</div>}
          <div ref={listRef} className="border rounded-b p-3 h-[60vh] overflow-auto bg-white dark:bg-gray-900">
            {messages.map((m, idx) => {
              const isMine = m.fromUserId === myId || m.fromUserId === 'me';
              const isLastInThread = idx === messages.length - 1;
              const seen = !!(isMine && isLastInThread && thread?.seenByUserId === String(peer?.id) && thread?.seenAt && (new Date(thread.seenAt).getTime() >= new Date(m.createdAt).getTime()));
              const myAvatar = (user as any)?.avatarUrl || (user as any)?.photoURL || '';
              const otherAvatar = peer?.avatarUrl || '';
              const initial = (isMine ? ((user as any)?.username || 'U') : (peer?.username || 'U')).charAt(0).toUpperCase();
              return (
                <div key={m.id} className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'} items-end`}>
                  {!isMine && (
                    <div className="mr-2">
                      {otherAvatar ? (
                        <img src={otherAvatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold">{initial}</div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[78%]`}>
                    <div className={`px-3 py-2 rounded-2xl ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-200 text-black rounded-bl-sm'} whitespace-pre-wrap`}>{m.text}</div>
                    <div className={`mt-1 text-[10px] ${isMine ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                      {new Date(m.createdAt).toLocaleString()} {seen ? <span className="ml-2 text-green-600 font-medium">Seen</span> : null}
                    </div>
                  </div>
                  {isMine && (
                    <div className="ml-2">
                      {myAvatar ? (
                        <img src={myAvatar} alt="me" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">{initial}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
              placeholder="Type a message"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={onSend} disabled={!text.trim()}>Send</button>
          </div>

          {/* Settings Drawer */}
          {settingsOpen && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/30" onClick={() => setSettingsOpen(false)}></div>
              <div className="absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white dark:bg-gray-900 border-l p-4 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold">Chat settings</div>
                  <button className="text-sm px-2 py-1 border rounded" onClick={() => setSettingsOpen(false)}>Close</button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-sm font-semibold">
                    {!isBlocked && peer?.avatarUrl ? (
                      <img src={peer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      'B'
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{isBlocked ? 'Blocked user' : (peer?.username || 'User')}</div>
                    {!isBlocked && peer?.username && (
                      <a href={`/u/${peer.username}`} className="text-xs text-blue-600 underline">View public profile</a>
                    )}
                    {isBlocked && (
                      <div className="text-[11px] text-gray-500">Profile, avatar and details are hidden because you blocked this user.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <div className="font-medium text-sm mb-2">Privacy</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">Disappearing messages</div>
                        <div className="text-[11px] text-gray-500">Delete messages automatically after 24 hours</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={disappearing24h} onChange={async (e) => {
                          const v = e.target.checked;
                          setDisappearing24h(v);
                          try {
                            setBusyAction(true);
                            await fetch(`/api/chat/threads/${threadId}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ disappearingAfterHours: v ? 24 : 0 }) });
                          } catch {}
                          finally { setBusyAction(false); }
                        }} />
                        <span className={`w-9 h-5 bg-gray-300 rounded-full p-0.5 ${disappearing24h ? 'bg-blue-600' : ''}`}>
                          <span className={`block w-4 h-4 bg-white rounded-full transform transition ${disappearing24h ? 'translate-x-4' : ''}`}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <div className="font-medium text-sm mb-2">Safety</div>
                    <div className="flex items-center gap-2">
                      {isBlocked ? (
                        <button
                          disabled={busyAction}
                          onClick={async () => {
                            try {
                              setBusyAction(true);
                              await fetch(`/api/chat/threads/${threadId}/unblock`, { method: 'POST', credentials: 'include' });
                              setIsBlocked(false);
                            } catch (e) { alert('Failed to unblock'); }
                            finally { setBusyAction(false); }
                          }}
                          className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                          Unblock user
                        </button>
                      ) : (
                        <button
                          disabled={busyAction}
                          onClick={async () => {
                            try {
                              setBusyAction(true);
                              await fetch(`/api/chat/threads/${threadId}/block`, { method: 'POST', credentials: 'include' });
                              setIsBlocked(true);
                            } catch (e) { alert('Failed to block'); }
                            finally { setBusyAction(false); }
                          }}
                          className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Block user
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatThreadPage;