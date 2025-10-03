import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// List notifications for current user
// GET /api/notifications?status=unread|all&limit=&skip=
router.get('/', authenticate, async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '30'))));
    const skip = Math.max(0, parseInt(String(req.query.skip || '0')));

    const filter = { targetUser: req.user.id };
    if (status === 'unread') {
      filter.readAt = null;
    }

    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'username fullName avatarUrl')
      .lean();

    return res.json({ success: true, notifications: items });
  } catch (e) {
    console.error('List notifications error:', e);
    return res.status(500).json({ success: false, message: 'Failed to list notifications' });
  }
});

// Unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ targetUser: req.user.id, readAt: null });
    return res.json({ success: true, count });
  } catch (e) {
    return res.status(500).json({ success: false, count: 0 });
  }
});

// Mark read
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const note = await Notification.findOne({ _id: req.params.id, targetUser: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (!note.readAt) {
      note.readAt = new Date();
      await note.save();
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
});

// Approve follow request
// POST /api/notifications/follow-requests/:id/approve
router.post('/follow-requests/:id/approve', authenticate, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n || n.type !== 'follow_request') return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(n.targetUser) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not allowed' });
    if (n.status !== 'pending') return res.status(400).json({ success: false, message: 'Request is not pending' });

    const actorId = n.actor;
    const targetId = n.targetUser;

    // establish follow
    await Promise.all([
      User.updateOne({ _id: actorId }, { $addToSet: { following: targetId } }),
      User.updateOne({ _id: targetId }, { $addToSet: { followers: actorId } })
    ]);

    // friends if mutual
    const targetDoc = await User.findById(targetId).select('following');
    const mutual = Array.isArray(targetDoc?.following) && targetDoc.following.some(u => String(u) === String(actorId));
    if (mutual) {
      await Promise.all([
        User.updateOne({ _id: actorId }, { $addToSet: { friends: targetId } }),
        User.updateOne({ _id: targetId }, { $addToSet: { friends: actorId } })
      ]);
    }

    // update request
    n.status = 'approved';
    n.readAt = n.readAt || new Date();
    await n.save();

    // notify both sides
    await Promise.all([
      Notification.create({ type: 'follow_approved', actor: targetId, targetUser: actorId, status: 'delivered' }),
      Notification.create({ type: 'started_following', actor: actorId, targetUser: targetId, status: 'delivered' })
    ]);

    return res.json({ success: true, approved: true, isFriend: mutual });
  } catch (e) {
    console.error('Approve follow request error:', e);
    return res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

// Decline follow request
router.post('/follow-requests/:id/decline', authenticate, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n || n.type !== 'follow_request') return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(n.targetUser) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not allowed' });
    if (n.status !== 'pending') return res.status(400).json({ success: false, message: 'Request is not pending' });

    n.status = 'declined';
    n.readAt = n.readAt || new Date();
    await n.save();

    return res.json({ success: true, declined: true });
  } catch (e) {
    console.error('Decline follow request error:', e);
    return res.status(500).json({ success: false, message: 'Failed to decline request' });
  }
});

export default router;
