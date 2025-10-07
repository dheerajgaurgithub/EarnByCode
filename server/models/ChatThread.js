import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  lastMessageAt: { type: Date },
  // Per-thread settings
  settings: {
    disappearingAfterHours: { type: Number, default: 0 }, // 0 = disabled, 24 = delete after 24h
  },
  // Block flags per userId
  blocks: { type: Map, of: Boolean, default: {} },
  // Last read timestamp per userId
  lastReadAt: { type: Map, of: Date, default: {} },
}, { timestamps: true });

chatThreadSchema.index({ participants: 1 });
chatThreadSchema.index({ updatedAt: -1 });

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
export default ChatThread;
