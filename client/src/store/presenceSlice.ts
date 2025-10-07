import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PresenceState = Record<string, { online: boolean; lastSeen: string | null }>;

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {} as PresenceState,
  reducers: {
    setPresence(state, action: PayloadAction<{ userId: string; online: boolean; lastSeen: string | null }>) {
      const { userId, online, lastSeen } = action.payload;
      state[userId] = { online, lastSeen };
    }
  }
});

export const presenceReducer = presenceSlice.reducer;
export const presenceActions = presenceSlice.actions;
