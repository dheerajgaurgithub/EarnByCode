import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const updateContestStatuses = async () => {
  try {
    const now = new Date();

    // Update upcoming contests to live
    const upcomingContests = await Contest.find({
      status: 'upcoming',
      startTime: { $lte: now }
    });

    for (const contest of upcomingContests) {
      contest.status = 'live';
      await contest.save();
      console.log(`Contest ${contest.title} is now live`);
    }

    // Update live contests to ended and distribute prizes
    const liveContests = await Contest.find({
      status: 'live',
      endTime: { $lte: now }
    });

    for (const contest of liveContests) {
      contest.status = 'ended';
      
      // Update rankings and distribute prizes
      contest.updateRankings();
      contest.distributePrizes();
      
      // Award prizes to winners
      for (const participant of contest.participants) {
        if (participant.prize > 0) {
          await User.findByIdAndUpdate(participant.user, {
            $inc: { 
              walletBalance: participant.prize,
              points: participant.pointsEarned
            }
          });

          // Create prize transaction
          const transaction = new Transaction({
            user: participant.user,
            type: 'contest_prize',
            amount: participant.prize,
            description: `Prize for ${contest.title} - Rank #${participant.rank}`,
            status: 'completed',
            contest: contest._id
          });

          await transaction.save();
        } else {
          // Award participation points
          await User.findByIdAndUpdate(participant.user, {
            $inc: { points: participant.pointsEarned }
          });
        }
      }

      await contest.save();
      console.log(`Contest ${contest.title} ended and prizes distributed`);
    }
  } catch (error) {
    console.error('Contest status update error:', error);
  }
};

export const calculateGlobalRankings = async () => {
  try {
    const users = await User.find({ isAdmin: false })
      .sort({ points: -1, codecoins: -1, createdAt: 1 });

    for (let i = 0; i < users.length; i++) {
      users[i].ranking = i + 1;
      await users[i].save();
    }

    console.log('Global rankings updated');
  } catch (error) {
    console.error('Error updating rankings:', error);
  }
};
