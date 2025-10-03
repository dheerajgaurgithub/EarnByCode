import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['follow_request', 'follow_approved', 'started_following', 'contest_assigned', 'admin_discussion'],
    required: true,
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who triggered
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // receiver
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'delivered'],
    default: 'pending'
  },
  readAt: { type: Date, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

notificationSchema.index({ targetUser: 1, createdAt: -1 });
notificationSchema.index({ targetUser: 1, readAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
