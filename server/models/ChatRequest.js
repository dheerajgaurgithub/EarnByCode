import mongoose from 'mongoose';

const chatRequestSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  attempts: { type: Number, default: 1 }, // allow max 2
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread' },
  firstMessage: { type: String },
}, { timestamps: true });

chatRequestSchema.index({ toUserId: 1, createdAt: -1 });
chatRequestSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);
export default ChatRequest;
