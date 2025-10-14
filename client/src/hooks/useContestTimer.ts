import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateContestTimer, contestEnded, contestEndingSoon } from '@/store/contestSlice';

export const useContestTimer = () => {
  const dispatch = useAppDispatch();
  const contestTimer = useAppSelector((state) => state.contest.contestTimer);
  const currentContest = useAppSelector((state) => state.contest.currentContest);
  const autoRefresh = useAppSelector((state) => state.contest.autoRefresh);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Timer update function
  const updateTimer = useCallback(() => {
    if (!contestTimer || !contestTimer.isRunning || contestTimer.isPaused) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Only update if at least 1 second has passed
    if (timeSinceLastUpdate >= 1000) {
      dispatch(updateContestTimer());
      lastUpdateRef.current = now;

      // Check if contest is ending soon (5 minutes or less)
      if (contestTimer.timeRemaining <= 300 && contestTimer.timeRemaining > 0) {
        const minutesLeft = Math.ceil(contestTimer.timeRemaining / 60);
        if (minutesLeft <= 5 && minutesLeft > 0) {
          dispatch(contestEndingSoon({
            contestId: currentContest?.id || '',
            minutesLeft
          }));
        }
      }

      // Check if contest has ended
      if (contestTimer.timeRemaining <= 0 && currentContest) {
        dispatch(contestEnded(currentContest));
      }
    }
  }, [dispatch, contestTimer, currentContest]);

  // Start/stop timer based on contest state
  useEffect(() => {
    if (contestTimer && contestTimer.isRunning && !contestTimer.isPaused && autoRefresh) {
      intervalRef.current = setInterval(updateTimer, 1000);
      lastUpdateRef.current = Date.now();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [contestTimer, autoRefresh, updateTimer]);

  // Manual timer update (for when auto-refresh is disabled)
  const manualUpdate = useCallback(() => {
    if (contestTimer) {
      dispatch(updateContestTimer());
      lastUpdateRef.current = Date.now();

      // Check notifications
      if (contestTimer.timeRemaining <= 300 && contestTimer.timeRemaining > 0 && currentContest) {
        const minutesLeft = Math.ceil(contestTimer.timeRemaining / 60);
        if (minutesLeft <= 5 && minutesLeft > 0) {
          dispatch(contestEndingSoon({
            contestId: currentContest.id,
            minutesLeft
          }));
        }
      }

      if (contestTimer.timeRemaining <= 0 && currentContest) {
        dispatch(contestEnded(currentContest));
      }
    }
  }, [dispatch, contestTimer, currentContest]);

  return {
    contestTimer,
    isRunning: contestTimer?.isRunning || false,
    timeRemaining: contestTimer?.timeRemaining || 0,
    manualUpdate,
  };
};
