import { Store } from '@reduxjs/toolkit';
import { getSocket } from '@/lib/socket';
import { chatThreadsActions } from './store/chatThreadsSlice';
import { messagesActions } from './store/messagesSlice';
import { presenceActions } from './store/presenceSlice';

export function startSocketListeners(store: Store) {
  const s = getSocket();

  // Presence updates
  const onPresence = (p: { userId: string; online: boolean; lastSeen: string | null }) => {
    store.dispatch(presenceActions.setPresence(p));
    store.dispatch(chatThreadsActions.setOtherPresence(p));
  };

  // Message in any thread
  const onMessage = (m: { id: string; threadId: string; fromUserId: string; text: string; createdAt: string }) => {
    store.dispatch(messagesActions.messageReceived(m));
    store.dispatch(chatThreadsActions.threadBumped({ threadId: m.threadId, id: m.id, text: m.text, createdAt: m.createdAt }));
    try { window.dispatchEvent(new CustomEvent('chat:updated')); } catch {}
  };

  // Thread summary bump for lists
  const onThreadUpdate = (u: { threadId: string; lastMessage: { id: string; text: string; createdAt: string } }) => {
    store.dispatch(chatThreadsActions.lastMessageUpdated(u));
  };

  s.on('presence:update', onPresence);
  s.on('chat:message', onMessage);
  s.on('chat:thread:update', onThreadUpdate);
}
