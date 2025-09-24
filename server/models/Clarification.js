import mongoose from 'mongoose';

const ClarificationSchema = new mongoose.Schema(
  {
    contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: '', trim: true },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPrivate: { type: Boolean, default: false },
    visibility: { type: String, enum: ['all', 'team'], default: 'all' },
    tags: { type: [String], default: [] },
    answeredAt: { type: Date },
  },
  { timestamps: true }
);

ClarificationSchema.index({ contest: 1, createdAt: -1 });

const Clarification = mongoose.model('Clarification', ClarificationSchema);
export default Clarification;
