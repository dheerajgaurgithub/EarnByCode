import mongoose from 'mongoose';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Transaction from '../models/Transaction.js';
import RewardLog from '../models/RewardLog.js';

// Utility: compute current streak (accepted submissions) in UTC days
async function computeUserStreak(userId) {
  const subs = await Submission.find({ user: userId, status: 'Accepted' })
    .select('createdAt')
    .sort({ createdAt: 1 })
    .lean();
  const toUTCDateStr = (d) => {
    const dt = new Date(d);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const uniqueDays = Array.from(new Set(subs.map(s => toUTCDateStr(s.createdAt)))).sort();
  let maxStreak = 0;
  let cur = 0;
  let prev = null;
  for (const ds of uniqueDays) {
    const d = new Date(ds + 'T00:00:00Z');
    if (prev) {
      const prevD = new Date(prev + 'T00:00:00Z');
      const diffDays = Math.round((d.getTime() - prevD.getTime()) / (24 * 60 * 60 * 1000));
      cur = (diffDays === 1) ? (cur + 1) : 1;
    } else {
      cur = 1;
    }
    if (cur > maxStreak) maxStreak = cur;
    prev = ds;
  }
  // Current streak ending today or yesterday
  const todayUTC = new Date();
  const todayStr = toUTCDateStr(todayUTC);
  const daySet = new Set(uniqueDays);
  let currentStreak = 0;
  let cursor = daySet.has(todayStr)
    ? new Date(todayStr + 'T00:00:00Z')
    : new Date(new Date(todayStr + 'T00:00:00Z').getTime() - 24 * 60 * 60 * 1000);
  while (true) {
    const cstr = toUTCDateStr(cursor);
    if (daySet.has(cstr)) {
      currentStreak += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }
  return { currentStreak, maxStreak };
}

// Grant streak rewards for thresholds with idempotency
export async function grantStreakRewardsDaily() {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(today.getUTCDate()).padStart(2, '0');
    const period = `daily-${yyyy}-${mm}-${dd}`;

    // Process eligible users (non-admin)
    const users = await User.find({ isAdmin: false }).select('_id walletBalance walletCurrency codecoins username').lean();
    for (const u of users) {
      const { currentStreak } = await computeUserStreak(u._id);
      // Two thresholds: 100-day => ₹100; 200-day => ₹200 + 50 codecoins
      const rewards = [];
      if (currentStreak === 100) rewards.push({ amount: 100, codecoins: 0, note: '100-day streak reward' });
      if (currentStreak === 200) rewards.push({ amount: 200, codecoins: 50, note: '200-day streak reward' });
      for (const r of rewards) {
        // Idempotency: ensure not already granted for this user/period/note
        const key = `${period}:${r.note}`;
        const exists = await RewardLog.findOne({ type: 'streak', period: key, user: u._id }).session(session);
        if (exists) continue;

        const userDoc = await User.findById(u._id).session(session);
        if (!userDoc) continue;
        userDoc.walletBalance = parseFloat((Number(userDoc.walletBalance) + r.amount).toFixed(2));
        if (r.codecoins) userDoc.codecoins = (Number(userDoc.codecoins) || 0) + r.codecoins;
        await userDoc.save({ session });

        await Transaction.create([
          {
            user: userDoc._id,
            type: 'reward',
            amount: r.amount,
            currency: userDoc.walletCurrency || 'INR',
            description: r.note,
            status: 'completed',
            fee: 0,
            netAmount: r.amount,
            balanceAfter: userDoc.walletBalance,
            metadata: { kind: 'streak', streak: currentStreak }
          }
        ], { session });

        await RewardLog.create([{
          type: 'streak', period: key, user: userDoc._id, amount: r.amount, codecoins: r.codecoins, note: r.note
        }], { session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    return { ok: true };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('grantStreakRewardsDaily error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
}

// Grant monthly leaderboard bonuses with idempotency
export async function grantMonthlyLeaderboardRewards(targetYear, targetMonth /* 1-12 */) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Determine period label, default to previous month
    let year = targetYear;
    let month = targetMonth;
    if (!year || !month) {
      const now = new Date();
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      d.setUTCMonth(d.getUTCMonth() - 1); // previous month
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
    }
    const period = `month-${year}-${String(month).padStart(2, '0')}`;

    // Idempotency check: if any log exists for monthly period, skip
    const any = await RewardLog.findOne({ type: 'monthly', period }).session(session);
    if (any) {
      await session.abortTransaction();
      session.endSession();
      return { ok: true, skipped: true, reason: 'already granted' };
    }

    // Rank by points (non-admin). Note: all-time points; refine later if monthly points available
    const top = await User.find({ isAdmin: false })
      .select('_id points walletBalance walletCurrency codecoins username')
      .sort({ points: -1, _id: 1 })
      .limit(10)
      .session(session);

    const applyReward = async (userDoc, amount, codecoins, note) => {
      userDoc.walletBalance = parseFloat((Number(userDoc.walletBalance) + amount).toFixed(2));
      if (codecoins) userDoc.codecoins = (Number(userDoc.codecoins) || 0) + codecoins;
      await userDoc.save({ session });
      await Transaction.create([
        {
          user: userDoc._id,
          type: 'reward',
          amount,
          currency: userDoc.walletCurrency || 'INR',
          description: note,
          status: 'completed',
          fee: 0,
          netAmount: amount,
          balanceAfter: userDoc.walletBalance,
          metadata: { kind: 'monthly', period }
        }
      ], { session });
      await RewardLog.create([{ type: 'monthly', period, user: userDoc._id, amount, codecoins, note }], { session });
    };

    for (let i = 0; i < top.length; i++) {
      const u = top[i];
      const userDoc = await User.findById(u._id).session(session);
      if (!userDoc) continue;
      if (i < 3) {
        await applyReward(userDoc, 100, 20, `Monthly Top ${i + 1} bonus (${period})`);
      } else if (i >= 3 && i < 10) {
        await applyReward(userDoc, 50, 10, `Monthly Rank ${i + 1} bonus (${period})`);
      }
    }

    await session.commitTransaction();
    session.endSession();
    return { ok: true };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('grantMonthlyLeaderboardRewards error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
}
