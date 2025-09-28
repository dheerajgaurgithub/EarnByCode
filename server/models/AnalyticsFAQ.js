import mongoose from 'mongoose';

const AnalyticsFAQSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    helpfulUp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    helpfulDown: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Normalize helper to keep questions consistent
export const normalizeQuestion = (q = '') =>
  String(q)
    .toLowerCase()
    .replace(/[^a-z0-9\s/.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);

AnalyticsFAQSchema.index({ question: 1 }, { unique: true });

const AnalyticsFAQ = mongoose.models.AnalyticsFAQ || mongoose.model('AnalyticsFAQ', AnalyticsFAQSchema);
export default AnalyticsFAQ;
