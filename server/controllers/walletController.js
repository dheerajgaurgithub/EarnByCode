import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance walletCurrency walletStatus');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      balance: user.walletBalance,
      currency: user.walletCurrency,
      status: user.walletStatus,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wallet balance' });
  }
};

// Initiate a deposit: create a pending transaction. Client can attach Razorpay order/payment later.
export const initiateDeposit = async (req, res) => {
  try {
    const { amount, provider = 'razorpay', note } = req.body || {};
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt < 1) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is ₹1' });
    }

    const me = await User.findById(req.user._id).select('walletBalance');
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    const txn = new Transaction({
      user: me._id,
      type: 'deposit',
      amount: amt,
      currency: 'INR',
      description: `Deposit via ${provider}`,
      status: 'pending',
      fee: 0,
      netAmount: amt,
      balanceAfter: me.walletBalance, // unchanged until confirmed
      metadata: {
        provider,
        note: note || '',
      }
    });
    await txn.save();

    // Optionally, you can create a Razorpay order here and store in metadata
    return res.json({ success: true, transactionId: txn._id, pending: true });
  } catch (error) {
    console.error('Initiate deposit error:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate deposit' });
  }
};

// Confirm a deposit: verify payment (best-effort) and credit wallet
export const confirmDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { transactionId, provider = 'razorpay', paymentId, orderId, signature } = req.body || {};
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

    const txn = await Transaction.findOne({ _id: transactionId, user: req.user._id }).session(session);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (txn.status !== 'pending' || txn.type !== 'deposit') {
      return res.status(400).json({ success: false, message: 'Transaction is not a pending deposit' });
    }

    // TODO: Verify provider signature (Razorpay) if keys available
    // For now, accept and credit best-effort
    const me = await User.findById(req.user._id).session(session);
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    me.walletBalance = parseFloat((me.walletBalance + txn.amount).toFixed(2));
    await me.save({ session });

    txn.status = 'completed';
    txn.description = `Deposit successful via ${provider}`;
    if (paymentId) txn.referenceId = paymentId;
    txn.balanceAfter = me.walletBalance;
    txn.metadata = txn.metadata || {};
    txn.metadata.set('provider', provider);
    if (orderId) txn.metadata.set('orderId', orderId);
    if (signature) txn.metadata.set('signature', signature);
    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, balance: me.walletBalance, transactionId: txn._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Confirm deposit error:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm deposit' });
  }
};

// User withdraw: create a pending withdrawal and deduct balance immediately
export const requestWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, method, details = {} } = req.body || {};
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt < 1) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹1' });
    }
    const me = await User.findById(req.user._id).session(session);
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });
    if ((me.walletBalance || 0) < amt) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Deduct immediately to hold funds
    me.walletBalance = parseFloat((me.walletBalance - amt).toFixed(2));
    await me.save({ session });

    const txn = new Transaction({
      user: me._id,
      type: 'withdrawal',
      amount: -amt,
      currency: 'INR',
      description: 'Withdrawal request',
      status: 'pending',
      fee: 0,
      netAmount: -amt,
      balanceAfter: me.walletBalance,
      metadata: {
        method: method || 'upi',
        details,
      }
    });
    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, pending: true, balance: me.walletBalance, transactionId: txn._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Request withdraw error:', error);
    return res.status(500).json({ success: false, message: 'Failed to request withdrawal' });
  }
};

// Admin: complete a user withdrawal (mark as completed after payout)
export const adminCompleteWithdrawal = async (req, res) => {
  try {
    const { id } = req.params; // transactionId
    const txn = await Transaction.findById(id);
    if (!txn || txn.type !== 'withdrawal') return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (txn.status !== 'pending') return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    txn.status = 'completed';
    txn.description = 'Withdrawal successful';
    await txn.save();
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin complete withdrawal error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete withdrawal' });
  }
};

// Total winnings: sum of all contest_prize for current user
export const getTotalWinnings = async (req, res) => {
  try {
    const agg = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id), type: 'contest_prize', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const total = agg[0]?.total || 0;
    return res.json({ success: true, total });
  } catch (error) {
    console.error('Get total winnings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute winnings' });
  }
};

// Admin: withdraw admin earnings from admin's wallet

// Admin: aggregated metrics across all users
export const adminGetMetrics = async (req, res) => {
  try {
    const [collectedAgg, payoutsAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'contest_entry' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'contest_prize' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
    ]);

    const totalCollected = collectedAgg[0]?.total || 0; // Sum(entry fee * joins)
    const totalPayouts = payoutsAgg[0]?.total || 0;     // Sum(all user winnings)

    // If you keep admin earnings in an admin user's wallet
    const adminUser = await User.findOne({ isAdmin: true }).select('walletBalance').lean();
    const adminBalance = adminUser?.walletBalance ?? Math.max(0, totalCollected - totalPayouts);

    // New naming to match requirements
    const totalPlatformBalance = totalCollected;
    const totalUserWinnings = totalPayouts;
    const platformEarnings = Math.max(0, totalPlatformBalance - totalUserWinnings);

    return res.json({
      success: true,
      metrics: {
        // Backward-compatible keys
        totalCollected,
        totalPayouts,
        adminBalance,
        // New keys per spec
        totalPlatformBalance,
        totalUserWinnings,
        platformEarnings,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
};

// Admin: list all transactions with optional filters
export const adminGetAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.user = userId;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Admin get all transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transactions' });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction history' });
  }
};

export const getWalletStatistics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalDeposits, totalWithdrawals, recentTransactions] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            type: 'deposit',
            status: 'completed',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            type: 'withdrawal',
            status: 'completed',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.find({
        user: req.user._id,
        createdAt: { $gte: thirtyDaysAgo }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
    ]);

    res.json({
      success: true,
      stats: {
        totalDeposits: totalDeposits[0]?.total || 0,
        depositCount: totalDeposits[0]?.count || 0,
        totalWithdrawals: Math.abs(totalWithdrawals[0]?.total) || 0,
        withdrawalCount: totalWithdrawals[0]?.count || 0,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get wallet statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wallet statistics' });
  }
};

// Admin only
export const adminGetAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.walletStatus = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('username email walletBalance walletCurrency walletStatus lastWalletActivity')
        .sort({ walletBalance: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    const totalBalance = await User.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);

    res.json({
      success: true,
      wallets: users,
      totalBalance: totalBalance[0]?.total || 0,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin get all wallets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wallets' });
  }
};

export const adminGetWalletTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments({ user: userId })
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin get wallet transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wallet transactions' });
  }
};
