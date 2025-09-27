import express from 'express';
import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Transaction from '../models/Transaction.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import DailyProblem from '../models/DailyProblem.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Get admin dashboard stats (read-only access to platform metrics)
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProblems, totalContests, activeContests] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Contest.countDocuments(),
      Contest.countDocuments({ status: 'live' })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProblems,
        totalContests,
        activeContests
      },
      // Don't include user-specific or transaction data that could be used for participation
      message: 'Admin access is restricted to platform management only.'
    });

// Set global daily problem for a given UTC date (YYYY-MM-DD). If date is omitted, uses today's UTC date.
router.post('/daily-problem', async (req, res) => {
  try {
    const { problemId, date } = req.body || {};
    if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required' });

    // Validate problem exists
    const problem = await Problem.findById(problemId).select('_id title');
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    // Normalize date to YYYY-MM-DD (UTC)
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const key = (typeof date === 'string' && /\d{4}-\d{2}-\d{2}/.test(date)) ? date : today;

    const up = await DailyProblem.findOneAndUpdate(
      { date: key },
      { $set: { problemId, updatedAt: new Date(), createdBy: req.user?._id } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, dailyProblem: { date: up.date, problemId: String(up.problemId) } });
  } catch (e) {
    console.error('Set daily problem error:', e);
    return res.status(500).json({ success: false, message: 'Failed to set daily problem' });
  }
});

// Backfill avatars for users linked with Google but missing avatarUrl
// POST /api/admin/backfill/google-avatars?dryRun=true&limit=500
router.post('/backfill/google-avatars', async (req, res) => {
  try {
    const dryRun = String(req.query.dryRun || '').toLowerCase() === 'true';
    const lim = Math.min(5000, Math.max(1, parseInt(String(req.query.limit || '1000'))));

    const candidates = await User.find({
      $and: [
        { $or: [ { googleProfile: { $exists: true } }, { googleId: { $exists: true, $ne: null } } ] },
        { $or: [ { avatarUrl: { $in: [null, ''] } }, { avatarUrl: { $exists: false } } ] }
      ]
    })
    .select('_id username email avatarUrl googleProfile')
    .limit(lim)
    .lean();

    let updated = 0;
    const changes = [];

    for (const u of candidates) {
      try {
        const gp = u.googleProfile || {};
        // Try common places for Google picture
        const photo = gp.picture || (Array.isArray(gp.photos) && gp.photos[0]?.value) || '';
        if (photo) {
          changes.push({ userId: u._id, username: u.username, email: u.email, picture: photo });
          if (!dryRun) {
            await User.updateOne({ _id: u._id }, { $set: { avatarUrl: photo } });
            updated += 1;
          }
        }
      } catch (e) {
        // keep going
      }
    }

    return res.json({ success: true, dryRun, scanned: candidates.length, updated: dryRun ? 0 : updated, candidates: changes });
  } catch (error) {
    console.error('Backfill google avatars error:', error);
    return res.status(500).json({ success: false, message: 'Failed to backfill avatars' });
  }
});

// Get global daily problem for a given date (YYYY-MM-DD). If omitted, returns today's UTC.
router.get('/daily-problem', async (req, res) => {
  try {
    const qd = String(req.query.date || '');
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const key = (/^\d{4}-\d{2}-\d{2}$/.test(qd) ? qd : `${yyyy}-${mm}-${dd}`);
    const doc = await DailyProblem.findOne({ date: key }).lean();
    if (!doc) return res.json({ success: true, dailyProblem: null });
    return res.json({ success: true, dailyProblem: { date: doc.date, problemId: String(doc.problemId) } });
  } catch (e) {
    console.error('Get daily problem error:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch daily problem' });
  }
});

// Recalculate all users' points from solvedProblems using difficulty mapping
// Difficulty mapping: easy=1, medium=2, hard=3 (default 1)
// Query: ?dryRun=true to preview without writing
router.post('/recalculate-points', authenticate, requireAdmin, async (req, res) => {
  try {
    const dryRun = String(req.query.dryRun || '').toLowerCase() === 'true';
    const users = await User.find({}).select('_id username solvedProblems points').lean();
    const allProblemIds = Array.from(new Set(users.flatMap(u => (u.solvedProblems || []).map(id => String(id)))));
    const problems = await Problem.find({ _id: { $in: allProblemIds } }).select('difficulty').lean();
    const pMap = new Map(problems.map(p => [String(p._id), String(p.difficulty || '').toLowerCase()]));

    const mapDiff = (d) => (d === 'easy' ? 1 : d === 'medium' ? 2 : d === 'hard' ? 3 : 1);
    const results = [];
    for (const u of users) {
      const sum = (u.solvedProblems || []).reduce((acc, pid) => {
        const d = pMap.get(String(pid)) || 'easy';
        return acc + mapDiff(d);
      }, 0);
      if (!dryRun) {
        await User.updateOne({ _id: u._id }, { $set: { points: sum } });
      }
      results.push({ userId: u._id, username: u.username, oldPoints: u.points || 0, newPoints: sum });
    }
    return res.json({ success: true, dryRun, updated: dryRun ? 0 : results.length, results });
  } catch (error) {
    console.error('Recalculate points error:', error);
    return res.status(500).json({ success: false, message: 'Failed to recalculate points' });
  }
});
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Get a single user's bank details (sanitized)
router.get('/users/:id/bank-details', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('username email fullName bankDetails createdAt updatedAt')
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Optional: simple access audit log
    try {
      console.info('[ADMIN] Bank details accessed', {
        adminId: req.user?._id,
        adminEmail: req.user?.email,
        targetUserId: user._id,
        at: new Date().toISOString()
      });
    } catch {}

    const bd = user.bankDetails || {};
    const payload = {
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      bankDetails: {
        bankAccountName: bd.bankAccountName || '',
        bankAccountNumberLast4: bd.bankAccountNumberLast4 || '',
        // Never expose encrypted full account number
        ifsc: bd.ifsc || '',
        bankName: bd.bankName || '',
        upiId: bd.upiId || '',
        verified: !!bd.verified,
        lastUpdatedAt: bd.lastUpdatedAt || null,
      }
    };
    return res.json(payload);
  } catch (error) {
    console.error('Admin get bank details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bank details' });
  }
});

// Create new problem
router.post('/problems', async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      createdBy: req.user._id
    };

    const problem = new Problem(problemData);
    await problem.save();

    res.status(201).json({ 
      message: 'Problem created successfully', 
      problem 
    });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ message: 'Failed to create problem' });
  }
});

// Update problem
router.put('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem updated successfully', problem });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Failed to update problem' });
  }
});

// Get all problems
router.get('/problems', async (req, res) => {
  try {
    const { limit = 10, page = 1, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [problems, total] = await Promise.all([
      Problem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Problem.countDocuments(query)
    ]);
    
    res.json({
      problems,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
});

// Delete problem
router.delete('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Also delete related submissions
    await Submission.deleteMany({ problem: req.params.id });

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Failed to delete problem' });
  }
});

// Create new contest
router.post('/contests', async (req, res) => {
  try {
    const contestData = {
      ...req.body,
      createdBy: req.user._id
    };

    const contest = new Contest(contestData);
    await contest.save();

    res.status(201).json({ 
      message: 'Contest created successfully', 
      contest 
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ message: 'Failed to create contest' });
  }
});

// Update contest
router.put('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json({ message: 'Contest updated successfully', contest });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ message: 'Failed to update contest' });
  }
});

// Get all contests
router.get('/contests', async (req, res) => {
  try {
    const { limit = 10, page = 1, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const [contests, total] = await Promise.all([
      Contest.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'username')
        .lean(),
      Contest.countDocuments(query)
    ]);
    
    res.json({
      contests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
});

// Delete contest
router.delete('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Refund participants if contest hasn't started
    if (contest.status === 'upcoming') {
      const list = Array.isArray(contest.participants) ? contest.participants : [];
      for (const participant of list) {
        try {
          // Support both shapes: ObjectId or { user: ObjectId }
          const participantId = (participant && typeof participant === 'object' && 'user' in participant)
            ? participant.user
            : participant;
          if (!participantId) continue;

          await User.findByIdAndUpdate(participantId, {
            $inc: { walletBalance: contest.entryFee }
          });

          // Create refund transaction (best-effort)
          const transaction = new Transaction({
            user: participantId,
            type: 'contest_refund',
            amount: contest.entryFee,
            description: `Refund for cancelled contest: ${contest.title}`,
            status: 'completed',
            contest: contest._id
          });
          await transaction.save().catch(() => {});
        } catch (e) {
          // Continue refunding others even if one fails
          console.warn('Refund participant failed:', e?.message || e);
        }
      }
    }

    await Contest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ message: 'Failed to delete contest' });
  }
});

// Block a user
router.post('/users/:id/block', async (req, res) => {
  try {
    const { reason, duration, durationUnit } = req.body;
    const userId = req.params.id;

    if (!reason || !duration || !durationUnit) {
      return res.status(400).json({ message: 'Reason, duration, and duration unit are required' });
    }

    const durationValue = parseInt(duration);
    if (isNaN(durationValue) || durationValue < 1) {
      return res.status(400).json({ message: 'Duration must be a positive number' });
    }

    let blockedUntil = new Date();
    switch (durationUnit) {
      case 'hours':
        blockedUntil.setHours(blockedUntil.getHours() + durationValue);
        break;
      case 'days':
        blockedUntil.setDate(blockedUntil.getDate() + durationValue);
        break;
      case 'weeks':
        blockedUntil.setDate(blockedUntil.getDate() + (durationValue * 7));
        break;
      case 'months':
        blockedUntil.setMonth(blockedUntil.getMonth() + durationValue);
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid duration unit. Use hours, days, weeks, or months' 
        });
    }

    const blockData = {
      isBlocked: true,
      blockReason: reason,
      blockedUntil,
      blockDuration: durationValue,
      blockDurationUnit: durationUnit,
      $push: {
        blockHistory: {
          blockedAt: new Date(),
          blockedUntil: new Date(blockedUntil),
          reason,
          blockedBy: req.user._id,
          duration: durationValue,
          durationUnit: durationUnit,
          action: 'blocked',
          adminNote: `Blocked by ${req.user.username} (${req.user.email})`
        }
      }
    };

    const user = await User.findByIdAndUpdate(
      userId,
      blockData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a clean user object for the response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason,
      blockDuration: user.blockDuration,
      blockDurationUnit: user.blockDurationUnit
    };

    res.json({ 
      message: `User blocked until ${new Date(blockedUntil).toLocaleString()}`,
      user: userResponse
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ 
      message: 'Failed to block user',
      error: error.message 
    });
  }
});

// Unblock a user
router.post('/users/:id/unblock', async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    // First get the current user data to check if they're actually blocked
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is not blocked, return success immediately
    if (!currentUser.isBlocked) {
      return res.json({ 
        message: 'User is not currently blocked',
        user: {
          id: currentUser._id,
          username: currentUser.username,
          email: currentUser.email,
          isBlocked: false
        }
      });
    }
    
    const updateData = {
      $set: {
        isBlocked: false,
        blockReason: '',
        blockedUntil: null,
        blockDuration: undefined,
        blockDurationUnit: undefined,
      },
      $push: {
        blockHistory: {
          unblockedAt: new Date(),
          unblockedBy: req.user._id,
          action: 'unblocked',
          reason: reason || 'Manually unblocked by admin',
          adminNote: `Unblocked by ${req.user.username} (${req.user.email})`,
          // Include the previous block details for reference
          previousBlock: {
            reason: currentUser.blockReason,
            blockedAt: currentUser.blockedAt,
            blockedUntil: currentUser.blockedUntil,
            duration: currentUser.blockDuration,
            durationUnit: currentUser.blockDurationUnit
          }
        }
      }
    };
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a clean user object for the response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason
    };

    res.json({ 
      message: 'User has been unblocked successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ 
      message: 'Failed to unblock user',
      error: error.message 
    });
  }
});

// Get all users for management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// List users' bank details (searchable & sortable)
router.get('/users/bank-details', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sort = 'lastUpdatedAt',
      order = 'desc',
      missing
    } = req.query;

    const p = Math.max(1, parseInt(page));
    const lim = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (p - 1) * lim;

    const query = {};
    const or = [];
    if (search) {
      const rx = { $regex: search, $options: 'i' };
      or.push(
        { username: rx },
        { email: rx },
        { fullName: rx },
        { 'bankDetails.bankAccountName': rx },
        { 'bankDetails.bankName': rx },
        { 'bankDetails.ifsc': rx },
        { 'bankDetails.upiId': rx },
        { 'bankDetails.bankAccountNumberLast4': rx }
      );
    }
    if (or.length) query.$or = or;

    // Missing filter: users without sufficient bank details
    if (String(missing) === 'true') {
      query.$and = [
        {
          $or: [
            { bankDetails: { $exists: false } },
            { 'bankDetails.bankAccountName': { $in: [null, ''] } },
            // Neither UPI nor Account last4 available
            { $and: [
              { $or: [ { 'bankDetails.upiId': { $in: [null, ''] } }, { 'bankDetails.upiId': { $exists: false } } ] },
              { $or: [ { 'bankDetails.bankAccountNumberLast4': { $in: [null, ''] } }, { 'bankDetails.bankAccountNumberLast4': { $exists: false } } ] }
            ]}
          ]
        }
      ];
    }

    const sortMap = {
      lastUpdatedAt: { 'bankDetails.lastUpdatedAt': order === 'asc' ? 1 : -1 },
      accountName: { 'bankDetails.bankAccountName': order === 'asc' ? 1 : -1 },
      bankName: { 'bankDetails.bankName': order === 'asc' ? 1 : -1 },
      ifsc: { 'bankDetails.ifsc': order === 'asc' ? 1 : -1 },
      createdAt: { createdAt: order === 'asc' ? 1 : -1 }
    };
    const sortSpec = sortMap[sort] || sortMap.lastUpdatedAt;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('username email fullName bankDetails createdAt updatedAt')
        .sort(sortSpec)
        .skip(skip)
        .limit(lim)
        .lean(),
      User.countDocuments(query)
    ]);

    // Do not expose encrypted account numbers
    const sanitized = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      bankDetails: {
        bankAccountName: u.bankDetails?.bankAccountName || '',
        bankAccountNumberLast4: u.bankDetails?.bankAccountNumberLast4 || '',
        ifsc: u.bankDetails?.ifsc || '',
        bankName: u.bankDetails?.bankName || '',
        upiId: u.bankDetails?.upiId || '',
        verified: !!u.bankDetails?.verified,
        lastUpdatedAt: u.bankDetails?.lastUpdatedAt || null
      },
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json({
      success: true,
      page: p,
      limit: lim,
      total,
      pages: Math.ceil(total / lim),
      users: sanitized
    });
  } catch (error) {
    console.error('Admin list bank details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bank details' });
  }
});

// Export users' bank details as CSV (supports same filters)
router.get('/users/bank-details/export', async (req, res) => {
  try {
    const { search = '', sort = 'lastUpdatedAt', order = 'desc', missing, format = 'csv', limit = 10000 } = req.query;

    const query = {};
    const or = [];
    if (search) {
      const rx = { $regex: search, $options: 'i' };
      or.push(
        { username: rx },
        { email: rx },
        { fullName: rx },
        { 'bankDetails.bankAccountName': rx },
        { 'bankDetails.bankName': rx },
        { 'bankDetails.ifsc': rx },
        { 'bankDetails.upiId': rx },
        { 'bankDetails.bankAccountNumberLast4': rx }
      );
    }
    if (or.length) query.$or = or;

    if (String(missing) === 'true') {
      query.$and = [
        {
          $or: [
            { bankDetails: { $exists: false } },
            { 'bankDetails.bankAccountName': { $in: [null, ''] } },
            { $and: [
              { $or: [ { 'bankDetails.upiId': { $in: [null, ''] } }, { 'bankDetails.upiId': { $exists: false } } ] },
              { $or: [ { 'bankDetails.bankAccountNumberLast4': { $in: [null, ''] } }, { 'bankDetails.bankAccountNumberLast4': { $exists: false } } ] }
            ]}
          ]
        }
      ];
    }

    const sortMap = {
      lastUpdatedAt: { 'bankDetails.lastUpdatedAt': order === 'asc' ? 1 : -1 },
      accountName: { 'bankDetails.bankAccountName': order === 'asc' ? 1 : -1 },
      bankName: { 'bankDetails.bankName': order === 'asc' ? 1 : -1 },
      ifsc: { 'bankDetails.ifsc': order === 'asc' ? 1 : -1 },
      createdAt: { createdAt: order === 'asc' ? 1 : -1 }
    };
    const sortSpec = sortMap[sort] || sortMap.lastUpdatedAt;

    const lim = Math.min(50000, Math.max(1, parseInt(limit)));
    const users = await User.find(query)
      .select('username email fullName bankDetails createdAt updatedAt')
      .sort(sortSpec)
      .limit(lim)
      .lean();

    // CSV export (Excel-friendly)
    const header = ['Username','Email','Full Name','Account Name','Bank Name','IFSC','UPI ID','Last 4','Verified','Last Updated'];
    const rows = users.map(u => [
      u.username || '',
      u.email || '',
      u.fullName || '',
      u.bankDetails?.bankAccountName || '',
      u.bankDetails?.bankName || '',
      u.bankDetails?.ifsc || '',
      u.bankDetails?.upiId || '',
      u.bankDetails?.bankAccountNumberLast4 || '',
      u.bankDetails?.verified ? 'Yes' : 'No',
      u.bankDetails?.lastUpdatedAt ? new Date(u.bankDetails.lastUpdatedAt).toISOString() : ''
    ]);

    // Simple CSV generator with escaping
    const escapeCsv = (val) => {
      const s = String(val ?? '');
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const csv = [header, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n');

    const fileName = `bank-details-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.status(200).send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (error) {
    console.error('Admin export bank details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export bank details' });
  }
});

export default router;