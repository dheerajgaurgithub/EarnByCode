import mongoose from 'mongoose';

const DailyProblemSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD (UTC)
    required: true,
    unique: true,
    index: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('DailyProblem', DailyProblemSchema);
