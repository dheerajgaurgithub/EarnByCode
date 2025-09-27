import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, trim: true, maxlength: 50 },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

pendingUserSchema.index({ email: 1 }, { unique: true });
pendingUserSchema.index({ username: 1 }, { unique: true });
pendingUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index (auto-clean after expiry)

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;
