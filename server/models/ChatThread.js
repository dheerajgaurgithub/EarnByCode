import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  lastMessageAt: { type: Date },
}, { timestamps: true });

chatThreadSchema.index({ participants: 1 });
chatThreadSchema.index({ updatedAt: -1 });

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
export default ChatThread;
