import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';

export const checkProblemAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // If it's a regular problem, allow access
    if (!problem.isContestOnly) {
      return next();
    }

    // For contest problems, check if user has access
    const contest = await Contest.findById(problem.contest);
    if (!contest) {
      return res.status(403).json({ message: 'Contest not found' });
    }

    // Allow access if contest has ended
    if (new Date() > contest.endTime) {
      return next();
    }

    // Allow access to problem authors only (admins can view but not participate)
    if (req.user && problem.createdBy.toString() === req.user.id) {
      return next();
    }
    
    // Admins can only view, not participate
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admins cannot participate in contests' });
    }

    // Check if user is a participant in the contest
    const isParticipant = contest.participants.some(
      p => p.user.toString() === req.user?.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant of this contest' });
    }

    // Check if contest has started
    if (new Date() < contest.startTime) {
      return res.status(403).json({ message: 'Contest has not started yet' });
    }

    next();
  } catch (error) {
    console.error('Error in checkProblemAccess:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkContestAccess = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const contest = await Contest.findById(contestId);
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Allow access to contest creators and admins
    if (req.user) {
      if (contest.createdBy.toString() === req.user.id || req.user.isAdmin) {
        return next();
      }
    }
    
    // Check if contest has started (only for non-admin users)
    if (new Date() < contest.startTime) {
      return res.status(403).json({ message: 'Contest has not started yet' });
    }

    // Check if user is a participant
    const isParticipant = contest.participants.some(
      p => p.user.toString() === req.user?.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant of this contest' });
    }

    next();
  } catch (error) {
    console.error('Error in checkContestAccess:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
