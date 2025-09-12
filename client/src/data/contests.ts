import { Contest } from '../types';

export const contests: Contest[] = [
  {
    id: '1',
    title: 'Weekly Contest 380',
    description: 'Join our weekly programming contest and compete with developers worldwide!',
    startTime: '2024-12-25T14:00:00Z',
    endTime: '2024-12-25T15:30:00Z',
    duration: 90,
    entryFee: 50,
    prizePool: 1000,
    maxParticipants: 100,
    problems: [1, 2],
    participants: [
      {
        userId: '1',
        username: 'johncode',
        score: 150,
        solvedProblems: 2,
        lastSubmissionTime: '2024-12-25T14:45:00Z',
        rank: 1,
        prize: 500,
        pointsEarned: 100
      }
    ],
    status: 'ended',
    createdBy: 'admin',
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    id: '2',
    title: 'New Year Challenge 2025',
    description: 'Start the new year with an exciting coding challenge! Special prizes await!',
    startTime: '2025-01-01T12:00:00Z',
    endTime: '2025-01-01T14:00:00Z',
    duration: 120,
    entryFee: 100,
    prizePool: 2500,
    maxParticipants: 200,
    problems: [1, 2],
    participants: [],
    status: 'upcoming',
    createdBy: 'admin',
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    id: '3',
    title: 'Algorithm Masters Cup',
    description: 'Test your algorithmic skills in this advanced competition!',
    startTime: '2024-12-28T16:00:00Z',
    endTime: '2024-12-28T18:00:00Z',
    duration: 120,
    entryFee: 75,
    prizePool: 1500,
    maxParticipants: 150,
    problems: [1, 2],
    participants: [],
    status: 'live',
    createdBy: 'admin',
    createdAt: '2024-12-20T10:00:00Z'
  }
];