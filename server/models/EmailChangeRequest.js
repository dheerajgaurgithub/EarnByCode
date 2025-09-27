import mongoose from 'mongoose';

const emailChangeRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  newEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
}, {
  timestamps: true,
});

// Ensure only one active request per user
emailChangeRequestSchema.index({ user: 1, newEmail: 1 }, { unique: true });
// TTL on expiresAt (document will be removed automatically after expiry)
emailChangeRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailChangeRequest = mongoose.model('EmailChangeRequest', emailChangeRequestSchema);
export default EmailChangeRequest;
