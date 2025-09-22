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

// Admin: withdraw admin earnings from admin's wallet
export const adminWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt < 10) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹10' });
    }

    // The admin making the request withdraws from their wallet
    const adminUser = await User.findById(req.user._id).session(session);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (adminUser.walletBalance < amt) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct and record transaction
    adminUser.walletBalance = parseFloat((adminUser.walletBalance - amt).toFixed(2));
    await adminUser.save({ session });

    const txn = new Transaction({
      user: adminUser._id,
      type: 'withdrawal',
      amount: -amt,
      currency: 'INR',
      description: `Admin withdrawal of ₹${amt.toFixed(2)}`,
      status: 'pending',
    });
    await txn.save({ session });

    // Simulate completion (or integrate RazorpayX payout here)
    setTimeout(async () => {
      try {
        txn.status = 'completed';
        await txn.save();
      } catch (e) {
        console.error('Admin withdraw finalize failed:', e);
      }
    }, 3000);

    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, balance: adminUser.walletBalance, transactionId: txn._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Admin withdraw error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process withdrawal' });
  }
};

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

    const totalCollected = collectedAgg[0]?.total || 0;
    const totalPayouts = payoutsAgg[0]?.total || 0;

    // If you keep admin earnings in an admin user's wallet
    const adminUser = await User.findOne({ isAdmin: true }).select('walletBalance').lean();
    const adminBalance = adminUser?.walletBalance ?? Math.max(0, totalCollected - totalPayouts);

    return res.json({
      success: true,
      metrics: {
        totalCollected,
        totalPayouts,
        adminBalance,
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
