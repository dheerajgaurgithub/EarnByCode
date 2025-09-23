import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import crypto from 'crypto';

const router = express.Router();
const paymentsMode = (process.env.PAYMENTS_MODE || '').toLowerCase(); // 'mock' to bypass live gateways
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

async function createRazorpayOrder(amountInRupees, userId) {
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
    // Razorpay receipt must be <= 40 chars. Use compact, deterministic format.
    const uid = String(userId || '').slice(-8);
    const ts = Date.now().toString().slice(-10);
    const receipt = `wal_${uid}_${ts}`.slice(0, 40);
    const order = await instance.orders.create({ 
      amount: amountPaise, 
      currency: 'INR',
      receipt,
      notes: { userId: String(userId) }
    });
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
    const order = await createRazorpayOrder(amount, req.user._id);
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

    // Idempotency: if we already have a completed txn for this payment_id, return success
    const existing = await Transaction.findOne({ 'metadata.payment_id': razorpay_payment_id, user: req.user._id });
    if (existing && existing.status === 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: true, balance: existing.balanceAfter, transactionId: existing._id });
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
    const [txn] = await Transaction.create([
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

    res.json({ success: true, balance: updatedUser.walletBalance, transactionId: txn._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Razorpay verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

// Lightweight health endpoint to check payments configuration (no secrets exposed)
router.get('/health', authenticate, admin, async (req, res) => {
  try {
    const mode = paymentsMode || (razorpayKeyId && razorpayKeySecret ? 'live' : 'mock');
    const keyIdMasked = razorpayKeyId
      ? razorpayKeyId.slice(0, 7) + '…' + razorpayKeyId.slice(-4)
      : '';
    return res.json({
      ok: true,
      mode,
      razorpay: {
        configured: Boolean(razorpayKeyId && razorpayKeySecret),
        keyIdPresent: Boolean(razorpayKeyId),
        webhookSecretPresent: Boolean(razorpayWebhookSecret),
        keyIdPreview: keyIdMasked,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
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
  return res.status(403).json({
    success: false,
    message: 'Withdrawals are disabled. Winnings are paid to your saved bank/UPI details in your profile.'
  });
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

// Razorpay webhook endpoint (redundant credit path)
router.post('/razorpay/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    if (!razorpayWebhookSecret) {
      return res.status(400).json({ success: false, message: 'Webhook secret not configured' });
    }
    const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
    const expected = crypto.createHmac('sha256', razorpayWebhookSecret).update(body).digest('hex');
    if (signature !== expected) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body.toString('utf8'));
    if (event?.event !== 'payment.captured') {
      return res.status(200).json({ success: true });
    }

    const entity = event.payload?.payment?.entity || {};
    const paymentId = entity.id;
    const orderId = entity.order_id;
    const notes = entity.notes || {};
    const amountPaise = Number(entity.amount || 0);
    const userId = notes.userId;
    if (!paymentId || !orderId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Idempotent upsert of transaction, then credit user
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const amt = Math.round(amountPaise / 100);
      const existing = await Transaction.findOne({ 'metadata.payment_id': paymentId, user: userId }).session(session);
      if (existing && existing.status === 'completed') {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ success: true });
      }

      // Create txn if missing
      let txn = existing;
      if (!txn) {
        const [created] = await Transaction.create([
          {
            user: userId,
            type: 'deposit',
            amount: amt,
            currency: 'INR',
            description: `Wallet deposit via Razorpay (webhook)`,
            status: 'completed',
            fee: 0,
            netAmount: amt,
            metadata: { gateway: 'razorpay', order_id: orderId, payment_id: paymentId },
          },
        ], { session });
        txn = created;
      } else {
        txn.status = 'completed';
        await txn.save({ session });
      }

      // Credit user
      const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amt } }, { new: true, session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ success: true, balance: user?.walletBalance });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      console.error('Webhook credit error:', e);
      return res.status(500).json({ success: false });
    }
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process Razorpay webhook' });
  }
});

export default router;