import { configureStore } from '@reduxjs/toolkit';
import { chatThreadsReducer } from './chatThreadsSlice';
import { messagesReducer } from './messagesSlice';
import { presenceReducer } from './presenceSlice';

export const store = configureStore({
  reducer: {
    chatThreads: chatThreadsReducer,
    messages: messagesReducer,
    presence: presenceReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
