import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import ChatThread from '../models/ChatThread.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRequest from '../models/ChatRequest.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Helper to find existing thread between two users
async function findThread(a, b) {
  return ChatThread.findOne({
    participants: { $all: [a, b], $size: 2 },
  });
}

// POST /api/chat/start { otherUserId }
router.post('/start', authenticate, async (req, res) => {
  try {
    const me = req.user?._id?.toString();
    const other = String(req.body?.otherUserId || '');
    if (!me || !mongoose.isValidObjectId(other)) return res.status(400).json({ message: 'Invalid user' });
    if (me === other) return res.status(400).json({ message: 'Cannot start chat with yourself' });

    // If approved thread exists, return it
    const existing = await findThread(me, other);
    if (existing && existing.approved) {
      return res.status(200).json({ threadId: existing._id.toString(), approvalStatus: 'approved' });
    }

    // Check most recent request between users
    const reqDoc = await ChatRequest.findOne({
      fromUserId: me,
      toUserId: other,
    }).sort({ createdAt: -1 });

    if (reqDoc) {
      return res.status(200).json({
        threadId: reqDoc.threadId?.toString(),
        approvalStatus: reqDoc.status,
        requestId: reqDoc._id.toString(),
      });
    }

    // Create pending request and notify recipient
    const created = await ChatRequest.create({ fromUserId: me, toUserId: other, status: 'pending', attempts: 1 });
    try {
      await Notification.create({
        type: 'chat_request',
        actor: me,
        targetUser: other,
        status: 'pending',
        metadata: { requestId: created._id.toString() },
      });
    } catch {}

    return res.status(200).json({ approvalStatus: 'pending', requestId: created._id.toString() });
  } catch (e) {
    console.error('chat/start error', e);
    return res.status(500).json({ message: 'Failed to start chat' });
  }
});

// POST /api/chat/requests { recipientId, firstMessage }
router.post('/requests', authenticate, async (req, res) => {
  try {
    const me = req.user?._id?.toString();
    const other = String(req.body?.recipientId || '');
    const firstMessage = (req.body?.firstMessage || '').toString();
    if (!me || !mongoose.isValidObjectId(other)) return res.status(400).json({ message: 'Invalid recipient' });
    if (me === other) return res.status(400).json({ message: 'Cannot message yourself' });

    let existing = await ChatRequest.findOne({ fromUserId: me, toUserId: other }).sort({ createdAt: -1 });
    if (existing) {
      return res.status(200).json({ requestId: existing._id.toString(), status: existing.status });
    }

    const created = await ChatRequest.create({ fromUserId: me, toUserId: other, status: 'pending', attempts: 1, firstMessage });
    try {
      await Notification.create({ type: 'chat_request', actor: me, targetUser: other, status: 'pending', metadata: { requestId: created._id.toString(), firstMessage } });
    } catch {}
    return res.status(200).json({ requestId: created._id.toString(), status: 'pending' });
  } catch (e) {
    console.error('chat/requests error', e);
    return res.status(500).json({ message: 'Failed to create request' });
  }
});

// POST /api/chat/requests/:id/approve
router.post('/requests/:id/approve', authenticate, async (req, res) => {
  try {
    const me = req.user?._id?.toString();
    const id = req.params.id;
    const doc = await ChatRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.toUserId) !== me) return res.status(403).json({ message: 'Not allowed' });

    // Create or update thread
    let thread = await findThread(doc.fromUserId, doc.toUserId);
    if (!thread) {
      thread = await ChatThread.create({ participants: [doc.fromUserId, doc.toUserId], approved: true, approvedAt: new Date() });
    } else {
      thread.approved = true;
      thread.approvedAt = new Date();
      await thread.save();
    }

    doc.status = 'approved';
    doc.threadId = thread._id;
    await doc.save();

    return res.status(200).json({ success: true, threadId: thread._id.toString() });
  } catch (e) {
    console.error('approve request error', e);
    return res.status(500).json({ message: 'Failed to approve' });
  }
});

// POST /api/chat/requests/:id/decline
router.post('/requests/:id/decline', authenticate, async (req, res) => {
  try {
    const me = req.user?._id?.toString();
    const id = req.params.id;
    const doc = await ChatRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.toUserId) !== me) return res.status(403).json({ message: 'Not allowed' });
    doc.status = 'declined';
    await doc.save();
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('decline request error', e);
    return res.status(500).json({ message: 'Failed to decline' });
  }
});

// POST /api/chat/requests/:id/retry (allow once)
router.post('/requests/:id/retry', authenticate, async (req, res) => {
  try {
    const me = req.user?._id?.toString();
    const id = req.params.id;
    const doc = await ChatRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.fromUserId) !== me) return res.status(403).json({ message: 'Not allowed' });
    if (doc.status === 'approved') return res.status(400).json({ message: 'Already approved' });
    if ((doc.attempts || 1) >= 2) return res.status(400).json({ message: 'Retry limit reached' });

    doc.status = 'pending';
    doc.attempts = (doc.attempts || 1) + 1;
    await doc.save();

    try { await Notification.create({ type: 'chat_request', actor: me, targetUser: doc.toUserId, status: 'pending', metadata: { requestId: doc._id.toString(), retry: true } }); } catch {}

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('retry request error', e);
    return res.status(500).json({ message: 'Failed to retry' });
  }
});

// GET /api/chat/threads
router.get('/threads', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threads = await ChatThread.find({ participants: me }).sort({ updatedAt: -1 }).lean();
    const ids = threads.map(t => t._id);
    const lastByThread = await ChatMessage.aggregate([
      { $match: { threadId: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$threadId', last: { $first: '$$ROOT' } } }
    ]);
    const lastMap = new Map(lastByThread.map(x => [String(x._id), x.last]));

    const populated = await Promise.all(threads.map(async (t) => {
      const other = t.participants.map(String).find(x => x !== String(me));
      return {
        threadId: String(t._id),
        otherUser: await (await mongoose.model('User').findById(other).select('_id username avatarUrl').lean()) || { id: other },
        lastMessage: lastMap.get(String(t._id)) ? { id: String(lastMap.get(String(t._id))._id), text: lastMap.get(String(t._id)).text, createdAt: lastMap.get(String(t._id)).createdAt } : undefined,
        unread: 0,
      };
    }));

    return res.status(200).json(populated);
  } catch (e) {
    console.error('threads list error', e);
    return res.status(500).json({ message: 'Failed to load threads' });
  }
});

// GET /api/chat/threads/:threadId/messages
router.get('/threads/:threadId/messages', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });
    if (!thread.approved) return res.status(403).json({ message: 'Chat not approved yet' });

    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);

    const q = { threadId: thread._id };
    if (cursor) Object.assign(q, { createdAt: { $lt: cursor } });

    const list = await ChatMessage.find(q).sort({ createdAt: 1 }).limit(limit).lean();
    return res.status(200).json(list.map(m => ({ id: String(m._id), threadId: String(m.threadId), fromUserId: String(m.fromUserId), text: m.text, createdAt: m.createdAt })));
  } catch (e) {
    console.error('messages list error', e);
    return res.status(500).json({ message: 'Failed to load messages' });
  }
});

// POST /api/chat/threads/:threadId/messages
router.post('/threads/:threadId/messages', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const text = (req.body?.text || '').toString();
    if (!text.trim()) return res.status(400).json({ message: 'Empty message' });

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });
    if (!thread.approved) return res.status(403).json({ message: 'Chat not approved yet' });

    const msg = await ChatMessage.create({ threadId: thread._id, fromUserId: me, text });
    thread.lastMessageAt = new Date();
    await thread.save();

    return res.status(200).json({ id: String(msg._id) });
  } catch (e) {
    console.error('send message error', e);
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
