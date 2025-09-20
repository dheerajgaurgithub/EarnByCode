import express from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const paymentsMode = (process.env.PAYMENTS_MODE || '').toLowerCase(); // 'mock' to bypass Stripe
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

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

// Confirm 3D Secure (SCA) for a PaymentIntent and finalize the deposit
router.post('/confirm-3d-secure', authenticate, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ success: false, message: 'Stripe is not configured on the server' });
    }

    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId is required' });
    }

    // Retrieve latest status
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status === 'requires_action' || pi.status === 'requires_confirmation') {
      // Try to confirm again, just in case
      await stripe.paymentIntents.confirm(paymentIntentId);
    }

    const updated = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (updated.status === 'succeeded') {
      const amount = (updated.amount_received ?? updated.amount ?? 0) / 100;
      if (amount > 0) {
        // Update wallet balance and record transaction if not already recorded
        const existing = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId, user: req.user._id });
        if (!existing) {
          // Credit wallet
          const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { walletBalance: amount } },
            { new: true }
          );
          const txn = new Transaction({
            user: req.user._id,
            type: 'deposit',
            amount,
            currency: 'INR',
            description: `Wallet deposit of ₹${amount.toFixed(2)} (3DS confirm)`,
            status: 'completed',
            stripePaymentIntentId: paymentIntentId,
          });
          await txn.save();
        }
      }

      return res.json({ success: true, status: 'succeeded' });
    }

    return res.status(202).json({ success: true, status: updated.status });
  } catch (error) {
    console.error('Confirm 3D Secure error:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
});

// Add funds to wallet
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethodId, method = 'card', details } = req.body;
    
    // Validation
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum deposit amount is ₹1' 
      });
    }

    // Mock mode: bypass Stripe, directly credit wallet and create transaction
    if (!stripe || paymentsMode === 'mock') {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { walletBalance: amount } },
            { new: true, session }
          );

          const transaction = await Transaction.create([
            {
              user: req.user._id,
              type: 'deposit',
              amount: amount,
              currency: 'INR',
              description: `Wallet deposit of ₹${Number(amount).toFixed(2)} via ${method.toUpperCase()} (mock)`,
              status: 'completed',
              metadata: { mode: 'mock', method, details: details || {} }
            }
          ], { session });

          await session.commitTransaction();
          session.endSession();

          return res.json({
            success: true,
            message: 'Funds added successfully (mock)',
            balance: updatedUser.walletBalance,
            transactionId: transaction[0]._id
          });
        } catch (e) {
          await session.abortTransaction();
          session.endSession();
          throw e;
        }
      } catch (e) {
        console.error('Mock deposit failed:', e);
        return res.status(500).json({ success: false, message: 'Failed to process deposit' });
      }
    }

    // If live mode and not card, currently unsupported
    if (method !== 'card') {
      return res.status(400).json({ success: false, message: `Payment method '${method}' is not supported in live mode` });
    }

    // Get or create Stripe customer (live mode)
    const customer = await getOrCreateStripeCustomer(req.user);
    
    try {
      // Attach payment method if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'inr',
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          userId: req.user._id.toString(),
          type: 'wallet_deposit'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Update user's wallet balance
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { $inc: { walletBalance: amount } },
          { new: true }
        );

        // Create transaction record
        const transaction = new Transaction({
          user: req.user._id,
          type: 'deposit',
          amount: amount,
          currency: 'INR',
          description: `Wallet deposit of ₹${amount.toFixed(2)}`,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
          metadata: { paymentMethod: paymentMethodId }
        });

        await transaction.save();

        return res.json({
          success: true,
          message: 'Funds added successfully',
          balance: updatedUser.walletBalance,
          transactionId: transaction._id
        });
      }
    } catch (error) {
      if (error.code === 'authentication_required') {
        // Handle 3D Secure authentication
        return res.status(402).json({
          requiresAction: true,
          paymentIntentId: error.raw.payment_intent.id,
          clientSecret: error.raw.payment_intent.client_secret
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process deposit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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