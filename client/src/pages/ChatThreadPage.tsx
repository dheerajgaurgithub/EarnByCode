import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, listThreads, type ChatMessage, type ChatThread } from '@/services/chat';
import ChatListPage from './ChatListPage';
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
  const [peer, setPeer] = useState<{ username: string; fullName?: string; avatarUrl?: string; id?: string; isOnline?: boolean; lastSeen?: string | null } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [disappearing24h, setDisappearing24h] = useState(false);

  const scrollToBottom = () => {
    try { listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  };

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
    } catch {
      return '';
    }
  };

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
            isOnline: (th as any).otherUserIsOnline,
            lastSeen: (th as any).otherUserLastSeen ?? null,
          });
        } catch {}
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
                {peer?.avatarUrl ? (
                  <img src={peer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (peer?.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left cursor-pointer">
                <div className="text-sm font-semibold">{peer?.fullName || peer?.username || 'Chat'}</div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${peer?.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {peer?.isOnline ? 'Online' : (peer?.lastSeen ? `Last seen ${formatLastSeen(peer.lastSeen)}` : 'Offline')}
                </div>
              </div>
            </button>
            {peer?.username && (
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
            {messages.map((m) => {
              const isMine = m.fromUserId === myId || m.fromUserId === 'me';
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
                    <div className={`mt-1 text-[10px] ${isMine ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>{new Date(m.createdAt).toLocaleString()}</div>
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
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold">
                    {(peer?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{peer?.username || 'User'}</div>
                    {peer?.username && (
                      <a href={`/u/${peer.username}`} className="text-xs text-blue-600 underline">View public profile</a>
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
                      <button
                        disabled={busyAction}
                        onClick={async () => {
                          try {
                            setBusyAction(true);
                            await fetch(`/api/chat/threads/${threadId}/block`, { method: 'POST', credentials: 'include' });
                            alert('User blocked for this thread.');
                          } catch (e) { alert('Failed to block'); }
                          finally { setBusyAction(false); }
                        }}
                        className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Block user
                      </button>
                      <button
                        disabled={busyAction}
                        onClick={async () => {
                          try {
                            setBusyAction(true);
                            await fetch(`/api/chat/threads/${threadId}/unblock`, { method: 'POST', credentials: 'include' });
                            alert('User unblocked.');
                          } catch (e) { alert('Failed to unblock'); }
                          finally { setBusyAction(false); }
                        }}
                        className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        Unblock user
                      </button>
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