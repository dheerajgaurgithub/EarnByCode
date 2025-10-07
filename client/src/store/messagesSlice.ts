import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';

export type ChatMessageEntity = {
  id: string;
  threadId: string;
  fromUserId: string;
  text: string;
  createdAt: string;
};

const messagesAdapter = createEntityAdapter<ChatMessageEntity>({
  sortComparer: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
});

const messagesSlice = createSlice({
  name: 'messages',
  initialState: messagesAdapter.getInitialState(),
  reducers: {
    messagesLoaded: messagesAdapter.upsertMany,
    messageReceived: (state, action: PayloadAction<ChatMessageEntity>) => {
      messagesAdapter.upsertOne(state, action.payload);
    },
    clearThread(state, action: PayloadAction<{ threadId: string }>) {
      const { threadId } = action.payload;
      const ids = (state.ids as string[]).filter(id => state.entities[id]?.threadId === threadId);
      messagesAdapter.removeMany(state, ids);
    }
  }
});

export const messagesReducer = messagesSlice.reducer;
export const messagesActions = messagesSlice.actions;
export const messagesSelectors = messagesAdapter.getSelectors<{
  messages: ReturnType<typeof messagesAdapter.getInitialState>
}>((state: any) => state.messages);
