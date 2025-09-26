import mongoose from 'mongoose';

const AnalyticsFAQHitSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, index: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AnalyticsFAQHitSchema.index({ createdAt: 1 });

const AnalyticsFAQHit = mongoose.models.AnalyticsFAQHit || mongoose.model('AnalyticsFAQHit', AnalyticsFAQHitSchema);
export default AnalyticsFAQHit;
