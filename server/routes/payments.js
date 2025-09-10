import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for deposit
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { amount } = req.body; // amount in dollars
    
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create or get Stripe customer
    let customer;
    if (req.user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.fullName || req.user.username,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      
      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customer.id
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        userId: req.user._id.toString(),
        type: 'wallet_deposit'
      }
    });

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount: amount,
      description: `Wallet deposit of $${amount}`,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id
    });

    await transaction.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Confirm payment and update wallet
router.post('/confirm-payment', authenticate, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Find and update transaction
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntentId,
        user: req.user._id
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Update transaction status
      transaction.status = 'completed';
      await transaction.save();

      // Update user wallet balance
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { walletBalance: transaction.amount }
      });

      res.json({ message: 'Payment confirmed and wallet updated' });
    } else {
      res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Withdraw money
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is $10' });
    }

    if (amount > req.user.walletBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      user: req.user._id,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal of $${amount}`,
      status: 'pending'
    });

    await transaction.save();

    // Deduct from wallet balance
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -amount }
    });

    // In a real app, you would initiate bank transfer here
    // For demo, we'll mark as completed after a delay
    setTimeout(async () => {
      transaction.status = 'completed';
      await transaction.save();
    }, 5000);

    res.json({ 
      message: 'Withdrawal request submitted successfully',
      transaction 
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

export default router;