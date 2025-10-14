import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentContest,
  setParticipants,
  setLeaderboard,
  updateParticipant,
  addContestSubmission,
  updateContestProblem,
  contestStarted,
  contestEnded,
  submissionAccepted,
  rankChanged,
  setContestTimer,
  setRealTimeUpdates,
  setLastUpdate,
  addNotification,
} from '@/store/contestSlice';

interface ContestWebSocketMessage {
  type: string;
  contestId: string;
  data: any;
  timestamp: string;
}

export const useContestWebSocket = () => {
  const dispatch = useAppDispatch();
  const currentContest = useAppSelector((state) => state.contest.currentContest);
  const realTimeUpdates = useAppSelector((state) => state.contest.realTimeUpdates);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for contest updates
  useEffect(() => {
    if (currentContest && realTimeUpdates) {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/contests/${currentContest.id}`;

      try {
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log(`🔗 Connected to contest WebSocket: ${currentContest.id}`);
          dispatch(setRealTimeUpdates(true));
        };

        socketRef.current.onmessage = (event) => {
          try {
            const message: ContestWebSocketMessage = JSON.parse(event.data);
            handleContestMessage(message);
          } catch (error) {
            console.error('Failed to parse contest WebSocket message:', error);
          }
        };

        socketRef.current.onerror = (error) => {
          console.error('Contest WebSocket error:', error);
          dispatch(setRealTimeUpdates(false));
        };

        socketRef.current.onclose = () => {
          console.log(`🔌 Contest WebSocket closed: ${currentContest.id}`);
          dispatch(setRealTimeUpdates(false));
        };

      } catch (error) {
        console.error('Failed to connect to contest WebSocket:', error);
        dispatch(setRealTimeUpdates(false));
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [currentContest?.id, realTimeUpdates, dispatch]);

  // Handle different types of contest messages
  const handleContestMessage = (message: ContestWebSocketMessage) => {
    dispatch(setLastUpdate(message.timestamp));

    switch (message.type) {
      case 'contest_started':
        dispatch(contestStarted(message.data));
        break;

      case 'contest_ended':
        dispatch(contestEnded(message.data));
        break;

      case 'participant_joined':
        dispatch(updateParticipant(message.data));
        break;

      case 'participant_left':
        dispatch(updateParticipant(message.data));
        break;

      case 'submission_accepted':
        dispatch(submissionAccepted(message.data));
        break;

      case 'rank_updated':
        dispatch(rankChanged(message.data));
        break;

      case 'leaderboard_updated':
        dispatch(setLeaderboard(message.data));
        break;

      case 'timer_updated':
        dispatch(setContestTimer(message.data));
        break;

      case 'problem_solved':
        dispatch(updateContestProblem({
          problemId: message.data.problemId,
          updates: {
            solved: true,
            points: message.data.points,
          }
        }));
        break;

      case 'contest_notification':
        dispatch(addNotification({
          id: message.data.id,
          type: message.data.notificationType,
          message: message.data.message,
          timestamp: message.timestamp,
          contestId: message.contestId,
          data: message.data,
        }));
        break;

      default:
        console.log('Unknown contest message type:', message.type);
    }
  };

  // Send contest action to server
  const sendContestAction = (action: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: action,
        data,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    sendContestAction,
  };
};
