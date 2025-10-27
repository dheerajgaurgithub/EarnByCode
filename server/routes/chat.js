import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import ChatThread from '../models/ChatThread.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRequest from '../models/ChatRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Simple health check for chat routes
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat routes are working',
    timestamp: new Date().toISOString(),
    hasAuth: !!req.user
  });
});

// Public debug endpoint (temporary)
router.get('/debug', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      message: 'Chat debug endpoint working',
      timestamp: new Date().toISOString(),
      hasAuth: !!req.user,
      authHeader: req.header('Authorization')?.substring(0, 20) + '...',
      userAgent: req.header('User-Agent')?.substring(0, 50) + '...',
      mongoConnection: mongoose.connection.readyState
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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

    // Mark related notifications as approved and read
    try {
      await Notification.updateMany(
        { type: 'chat_request', 'metadata.requestId': String(doc._id) },
        { $set: { status: 'approved', readAt: new Date() } }
      );
    } catch {}

    // Suggest follow-back to the approver if they are not already following the requester
    let suggestFollowBack = false;
    try {
      const meUser = await User.findById(me).select('following').lean();
      if (meUser && Array.isArray(meUser.following)) {
        suggestFollowBack = !meUser.following.map(String).includes(String(doc.fromUserId));
      }
    } catch {}

    return res.status(200).json({ success: true, threadId: thread._id.toString(), suggestFollowBack });
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

    // Mark related notifications as declined and read
    try {
      await Notification.updateMany(
        { type: 'chat_request', 'metadata.requestId': String(doc._id) },
        { $set: { status: 'declined', readAt: new Date() } }
      );
    } catch {}
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
    console.log('Chat threads request:', { userId: req.user._id, timestamp: new Date().toISOString() });

    const me = req.user?._id;
    if (!me) {
      console.error('Chat threads: No user ID in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const threads = await ChatThread.find({ participants: me }).sort({ updatedAt: -1 }).lean();
    console.log('Chat threads: Found', threads.length, 'threads for user');

    const ids = threads.map(t => t._id);
    const lastByThread = await ChatMessage.aggregate([
      { $match: { threadId: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$threadId', last: { $first: '$$ROOT' } } }
    ]);
    const lastMap = new Map(lastByThread.map(x => [String(x._id), x.last]));

    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
    const populated = await Promise.all(threads.map(async (t) => {
      const other = t.participants.map(String).find(x => x !== String(me));
      const ou = await mongoose.model('User')
        .findById(other)
        .select('_id username fullName avatarUrl walletLastActive updatedAt')
        .lean();
      const lastSeen = (ou?.walletLastActive || ou?.updatedAt || null);
      const isOnline = lastSeen ? (Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS) : false;
      // unread count: messages newer than my lastReadAt
      let unread = 0;
      try {
        const lastRead = t.lastReadAt instanceof Map ? t.lastReadAt.get(String(me)) : (t.lastReadAt ? t.lastReadAt.get(String(me)) : null);
        const q = { threadId: t._id };
        // apply disappearing cutoff if enabled
        const hours = t.settings?.disappearingAfterHours ? Number(t.settings.disappearingAfterHours) : 0;
        const cutoff = (hours && hours > 0) ? new Date(Date.now() - hours * 3600 * 1000) : null;
        const gtDate = [lastRead, cutoff].filter(Boolean).map(d => new Date(d)).sort((a,b)=>b.getTime()-a.getTime())[0];
        if (gtDate) Object.assign(q, { createdAt: { $gt: gtDate } });
        unread = await ChatMessage.countDocuments(q);
      } catch (error) {
        console.error('Error counting unread messages for thread', t._id, ':', error.message);
      }
      let last = lastMap.get(String(t._id));
      // hide last message if it expired by disappearing policy
      try {
        const hours = t.settings?.disappearingAfterHours ? Number(t.settings.disappearingAfterHours) : 0;
        if (hours && hours > 0 && last) {
          const cutoff = new Date(Date.now() - hours * 3600 * 1000);
          if (new Date(last.createdAt).getTime() <= cutoff.getTime()) last = null;
        }
      } catch (error) {
        console.error('Error checking message expiration for thread', t._id, ':', error.message);
      }
      let blockedByMe = false;
      try {
        const otherId = other ? String(other) : '';
        blockedByMe = Boolean(t.blocks && (t.blocks instanceof Map ? t.blocks.get(otherId) : (t.blocks?.[otherId])));
      } catch (error) {
        console.error('Error checking block status for thread', t._id, ':', error.message);
      }
      return {
        threadId: String(t._id),
        otherUser: ou ? { id: String(ou._id), username: ou.username, fullName: ou.fullName, avatarUrl: ou.avatarUrl } : { id: other },
        otherUserLastSeen: lastSeen || null,
        otherUserIsOnline: isOnline,
        lastMessage: last ? { id: String(last._id), text: last.text, createdAt: last.createdAt } : undefined,
        unread,
        blockedByMe,
      };
    }));

    console.log('Chat threads: Successfully returning', populated.length, 'populated threads');
    return res.status(200).json(populated);
  } catch (e) {
    console.error('Chat threads error:', e);
    console.error('Error stack:', e.stack);
    return res.status(500).json({ message: 'Failed to load threads', error: e.message });
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
    // apply disappearing cutoff for this thread
    const hours = thread.settings?.disappearingAfterHours ? Number(thread.settings.disappearingAfterHours) : 0;
    const cutoff = (hours && hours > 0) ? new Date(Date.now() - hours * 3600 * 1000) : null;
    if (cutoff) {
      q.createdAt = { ...(q.createdAt || {}), $gt: cutoff };
      // purge older messages permanently
      try { await ChatMessage.deleteMany({ threadId: thread._id, createdAt: { $lte: cutoff } }); } catch {}
    }
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
    // Block checks: if either side has a block flag, disallow sending
    try {
      const others = thread.participants.map(String).filter(id => id !== String(me));
      const other = others[0];
      const blockedByMe = Boolean(thread.blocks && thread.blocks.get(String(other)));
      const blockedByOther = Boolean(thread.blocks && thread.blocks.get(String(me)));
      if (blockedByMe || blockedByOther) {
        return res.status(403).json({ message: 'Messaging is blocked in this thread' });
      }
    } catch {}

    const msg = await ChatMessage.create({ threadId: thread._id, fromUserId: me, text });
    thread.lastMessageAt = new Date();
    await thread.save();

    // Realtime: notify both participants
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = { id: String(msg._id), threadId: String(thread._id), fromUserId: String(me), text, createdAt: msg.createdAt };
        const rooms = thread.participants.map(u => `user:${String(u)}`);
        io.to(rooms).emit('chat:message', payload);
        // lightweight thread update for lists
        io.to(rooms).emit('chat:thread:update', { threadId: String(thread._id), lastMessage: { id: payload.id, text: payload.text, createdAt: payload.createdAt } });
        // unread for the recipient
        const others = thread.participants.map(String).filter(id => id !== String(me));
        const recipient = others[0];
        try {
          const lastRead = thread.lastReadAt?.get(String(recipient));
          const q = { threadId: thread._id };
          if (lastRead) Object.assign(q, { createdAt: { $gt: new Date(lastRead) } });
          const unread = await ChatMessage.countDocuments(q);
          io.to(`user:${recipient}`).emit('chat:unread', { threadId: String(thread._id), unread });
        } catch {}
      }
    } catch (e) { console.warn('socket emit failed', e?.message || e); }

    return res.status(200).json({ id: String(msg._id) });
  } catch (e) {
    console.error('send message error', e);
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

// POST /api/chat/threads/:threadId/settings
router.post('/threads/:threadId/settings', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });

    const hours = Number(req.body?.disappearingAfterHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
      return res.status(400).json({ message: 'Invalid disappearingAfterHours' });
    }
    thread.settings = thread.settings || {};
    thread.settings.disappearingAfterHours = Math.floor(hours);
    await thread.save();
    return res.status(200).json({ success: true, settings: thread.settings });
  } catch (e) {
    console.error('thread settings error', e);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
});

// POST /api/chat/threads/:threadId/block (blocks the other user for current user)
router.post('/threads/:threadId/block', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });
    const others = thread.participants.map(String).filter(id => id !== String(me));
    const other = others[0];
    if (!thread.blocks) thread.blocks = new Map();
    thread.blocks.set(String(other), true);
    await thread.save();
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('thread block error', e);
    return res.status(500).json({ message: 'Failed to block user' });
  }
});

// POST /api/chat/threads/:threadId/unblock
router.post('/threads/:threadId/unblock', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });
    const others = thread.participants.map(String).filter(id => id !== String(me));
    const other = others[0];
    if (!thread.blocks) thread.blocks = new Map();
    thread.blocks.set(String(other), false);
    await thread.save();
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('thread unblock error', e);
    return res.status(500).json({ message: 'Failed to unblock user' });
  }
});

// POST /api/chat/threads/:threadId/read (update lastReadAt for current user)
router.post('/threads/:threadId/read', authenticate, async (req, res) => {
  try {
    const me = req.user?._id;
    const threadId = req.params.threadId;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!thread.participants.map(String).includes(String(me))) return res.status(403).json({ message: 'Not a participant' });
    if (!thread.lastReadAt) thread.lastReadAt = new Map();
    const readAt = new Date();
    thread.lastReadAt.set(String(me), readAt);
    await thread.save();
    // Emit seen + unread reset to both
    try {
      const io = req.app.get('io');
      if (io) {
        const rooms = thread.participants.map(u => `user:${String(u)}`);
        io.to(rooms).emit('chat:seen', { threadId: String(thread._id), byUserId: String(me), at: readAt.toISOString() });
        io.to(rooms).emit('chat:unread', { threadId: String(thread._id), unread: 0 });
      }
    } catch {}
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('thread read error', e);
    return res.status(500).json({ message: 'Failed to update read' });
  }
});

export default router;
