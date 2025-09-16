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
