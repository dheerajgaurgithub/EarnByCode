import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const paymentsMode = (process.env.PAYMENTS_MODE || '').toLowerCase(); // 'mock' to bypass live gateways
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

async function createRazorpayOrder(amountInRupees) {
  const amountPaise = Math.round(Number(amountInRupees) * 100);
  if (!razorpayKeyId || !razorpayKeySecret) {
    // Mock order when keys not present
    return {
      id: `order_mock_${Date.now()}`,
      amount: amountPaise,
      currency: 'INR',
      status: 'created',
    };
  }
  try {
    const { default: Razorpay } = await import('razorpay');
    const instance = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
    const order = await instance.orders.create({ amount: amountPaise, currency: 'INR' });
    return order;
  } catch (e) {
    console.error('Razorpay order error:', e);
    throw new Error('Failed to create payment order');
  }
}

function verifyRazorpaySignature({ order_id, payment_id, signature }) {
  if (!razorpayKeySecret) {
    // In mock, accept any signature
    return true;
  }
  const body = `${order_id}|${payment_id}`;
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(body).digest('hex');
  return expected === signature;
}

// Razorpay: Create deposit order
router.post('/razorpay/order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is ₹1' });
    }
    const order = await createRazorpayOrder(amount);
    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: razorpayKeyId || 'rzp_test_mock',
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Razorpay: Verify payment and credit wallet
router.post('/razorpay/verify', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const ok = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Credit wallet and record transaction
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: Number(amount) } },
      { new: true, session }
    );

    const amtNum = Number(amount);
    const fee = 0;
    const netAmount = amtNum - fee;
    const transaction = await Transaction.create([
      {
        user: req.user._id,
        type: 'deposit',
        amount: amtNum,
        currency: 'INR',
        description: `Wallet deposit of ₹${amtNum.toFixed(2)} via Razorpay`,
        status: 'completed',
        fee,
        netAmount,
        balanceAfter: updatedUser.walletBalance,
        metadata: {
          gateway: 'razorpay',
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
        },
      },
    ], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, balance: updatedUser.walletBalance, transactionId: transaction[0]._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Razorpay verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

// Helper function to create or retrieve Stripe customer
async function getOrCreateStripeCustomer(user) {
  try {
    if (user.stripeCustomerId) {
      return await stripe.customers.retrieve(user.stripeCustomerId);
    }
    
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName || user.username,
      metadata: { userId: user._id.toString() }
    });
    
    await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    return customer;
  } catch (error) {
    console.error('Stripe customer error:', error);
    throw new Error('Failed to process payment method');
  }
}

// Get wallet balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    res.json({ 
      success: true, 
      balance: user.walletBalance,
      currency: 'INR' 
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get wallet balance' 
    });
  }
});

// Stripe SCA confirm endpoint removed
router.post('/confirm-3d-secure', authenticate, async (req, res) => {
  return res.status(410).json({ success: false, message: 'Endpoint removed. Use Razorpay flow.' });
});

// Add funds to wallet
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is ₹1' });
    }
    if (paymentsMode === 'mock') {
      // For convenience, in mock mode credit directly
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { $inc: { walletBalance: Number(amount) } },
          { new: true, session }
        );
        const fee = 0;
        const netAmount = Number(amount) - fee;
        const [txn] = await Transaction.create([
          {
            user: req.user._id,
            type: 'deposit',
            amount: Number(amount),
            currency: 'INR',
            description: `Wallet deposit of ₹${Number(amount).toFixed(2)} (mock)` ,
            status: 'completed',
            fee,
            netAmount,
            balanceAfter: updatedUser.walletBalance,
            metadata: { mode: 'mock' }
          }
        ], { session });
        await session.commitTransaction();
        session.endSession();
        return res.json({ success: true, balance: updatedUser.walletBalance, transactionId: txn._id });
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
      }
    }
    return res.status(410).json({ success: false, message: 'Deposit via Stripe has been removed. Use /payments/razorpay/order and /payments/razorpay/verify' });
  } catch (error) {
    console.error('Deposit error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process deposit' });
  }
});

// Withdraw funds
router.post('/withdraw', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { amount, bankAccountId } = req.body;

    // Validation
    if (!amount || isNaN(amount) || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum withdrawal amount is ₹10' 
      });
    }

    if (amount > req.user.walletBalance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      user: req.user._id,
      type: 'withdrawal',
      amount: -amount,
      currency: 'INR',
      description: `Withdrawal of ₹${amount.toFixed(2)}`,
      status: 'pending',
      metadata: { bankAccountId }
    });

    await transaction.save({ session });

    // Deduct from wallet balance
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: -amount } },
      { session, new: true }
    );

    // In a real app, initiate bank transfer here using Stripe Connect
    // For demo, we'll simulate bank transfer
    setTimeout(async () => {
      try {
        transaction.status = 'completed';
        await transaction.save();
        console.log(`Withdrawal completed for user ${req.user._id}: ₹${amount}`);
      } catch (error) {
        console.error('Failed to update withdrawal status:', error);
      }
    }, 5000);

    await session.commitTransaction();
    session.endSession();

    res.json({ 
      success: true,
      message: 'Withdrawal request submitted successfully',
      transactionId: transaction._id,
      balance: req.user.walletBalance - amount
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process withdrawal' 
    });
  }
});

// Get transaction history with pagination
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
});

// Get transaction by ID
router.get('/transactions/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
});

export default router;