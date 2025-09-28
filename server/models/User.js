import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    type: String,
    maxlength: 100
  },
  website: {
    type: String,
    maxlength: 200
  },
  github: {
    type: String,
    maxlength: 100
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: ''
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  blockDuration: {
    type: Number,
    default: 0
  },
  blockDurationUnit: {
    type: String,
    enum: ['hours', 'days', 'weeks', 'months'],
    default: 'days'
  },
  blockHistory: [{
    blockedAt: Date,
    blockedUntil: Date,
    duration: Number,
    durationUnit: String,
    reason: String,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  linkedin: {
    type: String,
    maxlength: 100
  },
  twitter: {
    type: String,
    maxlength: 100
  },
  company: {
    type: String,
    maxlength: 100
  },
  school: {
    type: String,
    maxlength: 100
  },
  codecoins: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
    set: v => parseFloat(v.toFixed(2))
  },
  walletCurrency: {
    type: String,
    default: 'INR',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  walletStatus: {
    type: String,
    enum: ['active', 'suspended', 'restricted'],
    default: 'active'
  },
  preferredCurrency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR'],
    default: 'INR'
  },
  walletTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  walletLastActive: {
    type: Date,
    default: Date.now
  },
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  contestsParticipated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  }],
  ranking: {
    type: Number,
    default: 0
  },
  // User UI/UX preferences and settings
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    defaultCodeLanguage: { type: String, enum: ['javascript', 'python', 'java', 'cpp'], default: 'javascript' },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      contestReminders: { type: Boolean, default: true },
      submissionResults: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
      frequency: { type: String, enum: ['immediate', 'daily', 'weekly', 'none'], default: 'immediate' },
      digestTime: { type: String, default: '09:00' } // HH:MM in user timezone
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'registered', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showSolvedProblems: { type: Boolean, default: true },
      showContestHistory: { type: Boolean, default: true }
    },
    editor: {
      fontSize: { type: Number, default: 14, min: 10, max: 24 },
      tabSize: { type: Number, default: 2, min: 2, max: 8 },
      theme: { type: String, enum: ['light', 'vs-dark'], default: 'light' }
    },
    accessibility: {
      reducedMotion: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false }
    }
  },
  // Bank details for contest winnings payouts (store sensitive parts encrypted elsewhere if needed)
  bankDetails: {
    bankAccountName: { type: String, trim: true },
    bankAccountNumberEnc: { type: String, default: '' }, // encrypted account number
    bankAccountNumberLast4: { type: String, default: '' }, // last 4 for display
    ifsc: { type: String, trim: true },
    bankName: { type: String, trim: true },
    upiId: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    lastUpdatedAt: { type: Date },
    // OTP fields removed
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  googleId: String,
  googleProfile: Object,
  // Email change OTP fields removed
  // Profile avatar fields
  avatarUrl: {
    type: String,
    default: ''
  },
  avatarPublicId: {
    type: String,
    default: ''
  },
  // Rewards and badges
  rewards: {
    streak1000: {
      eligibleAt: { type: Date, default: null },
      claimed: { type: Boolean, default: false },
      claimedAt: { type: Date, default: null },
      shipped: { type: Boolean, default: false },
      shipment: {
        carrier: { type: String, default: '' },
        tracking: { type: String, default: '' },
        addressSnapshot: { type: String, default: '' },
        shippedAt: { type: Date, default: null }
      }
    }
  },
  // Per-user 'today's daily problem'
  dailyProblem: {
    date: { type: String, default: null }, // YYYY-MM-DD (UTC)
    problemId: { type: String, default: null }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  // If password already looks like a bcrypt hash, skip rehashing
  try {
    if (typeof this.password === 'string' && /^\$2[aby]\$\d{2}\$/.test(this.password)) {
      return next();
    }
  } catch {}
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.verificationToken;
  delete user.verificationTokenExpires;
  delete user.googleId;
  delete user.googleProfile;
  return user;
};

// Check if wallet is active
userSchema.methods.isWalletActive = function() {
  return this.walletStatus === 'active';
};

// Check if user has sufficient balance
userSchema.methods.hasSufficientBalance = function(amount) {
  return this.walletBalance >= amount;
};

// Add funds to wallet
userSchema.methods.addFunds = async function(amount, description, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Update user balance
    this.walletBalance = parseFloat((this.walletBalance + amount).toFixed(2));
    this.walletLastActive = new Date();
    await this.save({ session });

    // Create transaction record
    const Transaction = mongoose.model('Transaction');
    const transaction = new Transaction({
      user: this._id,
      type: 'deposit',
      amount: amount,
      currency: this.walletCurrency,
      description: description || `Wallet deposit of ${this.walletCurrency} ${amount.toFixed(2)}`,
      status: 'completed',
      metadata: {
        ...metadata,
        previousBalance: this.walletBalance - amount,
        newBalance: this.walletBalance
      }
    });

    await transaction.save({ session });
    
    // Add transaction reference to user
    this.walletTransactions.push(transaction._id);
    await this.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      newBalance: this.walletBalance,
      transactionId: transaction._id
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Deduct funds from wallet
userSchema.methods.deductFunds = async function(amount, description, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (!this.hasSufficientBalance(amount)) {
    throw new Error('Insufficient funds');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Update user balance
    this.walletBalance = parseFloat((this.walletBalance - amount).toFixed(2));
    this.walletLastActive = new Date();
    await this.save({ session });

    // Create transaction record
    const Transaction = mongoose.model('Transaction');
    const transaction = new Transaction({
      user: this._id,
      type: 'withdrawal',
      amount: -amount, // Store as negative for withdrawals
      currency: this.walletCurrency,
      description: description || `Wallet withdrawal of ${this.walletCurrency} ${amount.toFixed(2)}`,
      status: 'completed',
      metadata: {
        ...metadata,
        previousBalance: this.walletBalance + amount,
        newBalance: this.walletBalance
      }
    });

    await transaction.save({ session });
    
    // Add transaction reference to user
    this.walletTransactions.push(transaction._id);
    await this.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      newBalance: this.walletBalance,
      transactionId: transaction._id
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Transfer funds to another user
userSchema.methods.transferFunds = async function(toUserId, amount, description, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (!this.hasSufficientBalance(amount)) {
    throw new Error('Insufficient funds');
  }

  if (this._id.equals(toUserId)) {
    throw new Error('Cannot transfer to yourself');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find recipient user
    const recipient = await User.findById(toUserId).session(session);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Deduct from sender
    this.walletBalance = parseFloat((this.walletBalance - amount).toFixed(2));
    this.walletLastActive = new Date();
    await this.save({ session });

    // Add to recipient
    recipient.walletBalance = parseFloat((recipient.walletBalance + amount).toFixed(2));
    recipient.walletLastActive = new Date();
    await recipient.save({ session });

    // Create transactions for both users
    const Transaction = mongoose.model('Transaction');
    
    // Sender's transaction
    const senderTransaction = new Transaction({
      user: this._id,
      type: 'transfer',
      amount: -amount,
      currency: this.walletCurrency,
      description: description || `Transfer to ${recipient.username}`,
      status: 'completed',
      referenceId: `TFR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      metadata: {
        ...metadata,
        toUserId: recipient._id,
        toUsername: recipient.username,
        previousBalance: this.walletBalance + amount,
        newBalance: this.walletBalance
      }
    });

    // Recipient's transaction
    const recipientTransaction = new Transaction({
      user: recipient._id,
      type: 'transfer',
      amount: amount,
      currency: recipient.walletCurrency,
      description: description || `Transfer from ${this.username}`,
      status: 'completed',
      referenceId: senderTransaction.referenceId, // Same reference ID for both transactions
      metadata: {
        ...metadata,
        fromUserId: this._id,
        fromUsername: this.username,
        previousBalance: recipient.walletBalance - amount,
        newBalance: recipient.walletBalance
      }
    });

    await Promise.all([
      senderTransaction.save({ session }),
      recipientTransaction.save({ session })
    ]);
    
    // Update transaction references
    this.walletTransactions.push(senderTransaction._id);
    recipient.walletTransactions.push(recipientTransaction._id);
    
    await Promise.all([
      this.save({ session }),
      recipient.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      newBalance: this.walletBalance,
      transactionId: senderTransaction._id,
      referenceId: senderTransaction.referenceId
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;