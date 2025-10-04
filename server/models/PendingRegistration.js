import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  username: { type: String, required: true, trim: true, index: true },
  password: { type: String, required: true }, // stored as bcrypt hash
  fullName: { type: String, trim: true, default: '' },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'pending_registrations'
});

// Optional TTL index to auto-clean expired pending records (MongoDB requires background index creation)
pendingRegistrationSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);
export default PendingRegistration;
