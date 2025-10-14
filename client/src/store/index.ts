import { configureStore } from '@reduxjs/toolkit';
import { chatThreadsReducer } from './chatThreadsSlice';
import { messagesReducer } from './messagesSlice';
import { presenceReducer } from './presenceSlice';
import { codeEditorReducer } from './codeEditorSlice';
import { problemsReducer } from './problemsSlice';
import { submissionsReducer } from './submissionsSlice';
import { authReducer } from './authSlice';
import { routerReducer } from './routerSlice';
import { contestReducer } from './contestSlice';

export const store = configureStore({
  reducer: {
    chatThreads: chatThreadsReducer,
    messages: messagesReducer,
    presence: presenceReducer,
    codeEditor: codeEditorReducer,
    problems: problemsReducer,
    submissions: submissionsReducer,
    auth: authReducer,
    router: routerReducer,
    contest: contestReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for better performance
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
