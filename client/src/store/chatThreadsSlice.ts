import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';

export type ChatThreadEntity = {
  id: string; // duplicate of threadId for adapter default selectId
  threadId: string;
  otherUser: { id: string; username?: string; fullName?: string; avatarUrl?: string };
  lastMessage?: { id: string; text: string; createdAt: string };
  unread?: number;
  otherUserIsOnline?: boolean;
  otherUserLastSeen?: string | null;
  // seen status (last time any participant marked as read)
  seenAt?: string | null;
  seenByUserId?: string | null;
  blockedByMe?: boolean;
};

const threadsAdapter = createEntityAdapter<ChatThreadEntity>({
  sortComparer: (a,b) => {
    const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  }
});

const chatThreadsSlice = createSlice({
  name: 'chatThreads',
  initialState: threadsAdapter.getInitialState(),
  reducers: {
    setAll: threadsAdapter.setAll,
    upsertMany: threadsAdapter.upsertMany,
    lastMessageUpdated(state, action: PayloadAction<{ threadId: string; lastMessage: { id: string; text: string; createdAt: string } }>) {
      const { threadId, lastMessage } = action.payload;
      const t = state.entities[threadId];
      if (t) t.lastMessage = lastMessage;
    },
    threadBumped(state, action: PayloadAction<{ threadId: string; id: string; text: string; createdAt: string }>) {
      const { threadId, id, text, createdAt } = action.payload;
      const t = state.entities[threadId];
      if (t) t.lastMessage = { id, text, createdAt };
    },
    setOtherPresence(state, action: PayloadAction<{ userId: string; online: boolean; lastSeen: string | null }>) {
      const { userId, online, lastSeen } = action.payload;
      for (const tId of state.ids as string[]) {
        const t = state.entities[tId];
        if (t?.otherUser?.id === userId) {
          t.otherUserIsOnline = online;
          t.otherUserLastSeen = lastSeen;
        }
      }
    },
    setUnread(state, action: PayloadAction<{ threadId: string; unread: number }>) {
      const { threadId, unread } = action.payload;
      const t = state.entities[threadId] || state.entities[(state.ids as string[]).find(id => (state.entities[id] as any)?.threadId === threadId)!];
      if (t) t.unread = unread;
    },
    setSeen(state, action: PayloadAction<{ threadId: string; byUserId: string; at: string }>) {
      const { threadId, byUserId, at } = action.payload;
      const t = state.entities[threadId] || state.entities[(state.ids as string[]).find(id => (state.entities[id] as any)?.threadId === threadId)!];
      if (t) { t.seenAt = at; t.seenByUserId = byUserId; }
    }
  }
});

export const chatThreadsReducer = chatThreadsSlice.reducer;
export const chatThreadsActions = chatThreadsSlice.actions;
export const chatThreadsSelectors = threadsAdapter.getSelectors<{
  chatThreads: ReturnType<typeof threadsAdapter.getInitialState>
}>((state: any) => state.chatThreads);
