import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: [
        'deposit', 
        'withdrawal', 
        'contest_entry', 
        'contest_prize', 
        'contest_refund',
        'purchase',
        'refund',
        'transfer',
        'reward',
        'adjustment'
      ],
      message: '{VALUE} is not a valid transaction type'
    },
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be at least 0.01'],
    set: v => parseFloat(v.toFixed(2)) // Store amounts with 2 decimal places
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    enum: {
      values: ['USD', 'EUR', 'GBP', 'INR'],
      message: 'Currency {VALUE} is not supported'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  referenceId: {
    type: String,
    index: true
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    type: Map,
    of: String,
    default: {}
  },
  stripePaymentIntentId: {
    type: String,
    index: true,
    sparse: true
  },
  stripeChargeId: {
    type: String,
    index: true,
    sparse: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    index: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common query patterns
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Virtual for formatted amount (e.g., ₹10.00)
transactionSchema.virtual('formattedAmount').get(function() {
  const currency = this.currency || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });
  return formatter.format(this.amount);
});

// Pre-save hook to set reference ID if not provided
transactionSchema.pre('save', function(next) {
  if (!this.referenceId) {
    // Generate a unique reference ID (you can use any format you prefer)
    this.referenceId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: { $in: ['completed', 'refunded'] }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1,
        totalAmount: 1
      }
    }
  ]);
  
  return result.reduce((acc, curr) => ({
    ...acc,
    [curr.type]: {
      count: curr.count,
      totalAmount: curr.totalAmount
    }
  }), {});
};

// Instance method to check if transaction can be refunded
transactionSchema.methods.canBeRefunded = function() {
  return this.status === 'completed' && 
         ['deposit', 'purchase', 'contest_entry'].includes(this.type) &&
         !['refunded', 'disputed'].includes(this.status);
};

// Text index for search functionality
transactionSchema.index(
  { description: 'text', referenceId: 'text' },
  { weights: { description: 10, referenceId: 5 } }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;