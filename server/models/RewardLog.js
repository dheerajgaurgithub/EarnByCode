import mongoose from 'mongoose';

const rewardLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['streak', 'monthly'], required: true },
  period: { type: String, required: true }, // e.g., 'daily-2025-10-04' for streak or 'month-2025-09'
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, default: 0 },
  codecoins: { type: Number, default: 0 },
  note: { type: String, default: '' },
}, { timestamps: true });

rewardLogSchema.index({ type: 1, period: 1, user: 1 }, { unique: true });

const RewardLog = mongoose.model('RewardLog', rewardLogSchema);
export default RewardLog;
