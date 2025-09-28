import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from 'cloudinary';
// OTP/email sending no longer used here
import Submission from '../models/Submission.js';
// Email change OTP flow removed

// Initialize router
const router = express.Router();

// Bank OTP throttling removed

// Configure Cloudinary from environment
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get current user's bank details (sanitized)
router.get('/me/bank-details', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bankDetails');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const bd = user.bankDetails || {};
    const safe = {
      bankAccountName: bd.bankAccountName || '',
      bankAccountNumberLast4: bd.bankAccountNumberLast4 || '',
      ifsc: bd.ifsc || '',
      bankName: bd.bankName || '',
      upiId: bd.upiId || '',
      verified: !!bd.verified,
      lastUpdatedAt: bd.lastUpdatedAt || null,
    };
    return res.json({ success: true, bankDetails: safe });
  } catch (error) {
    console.error('Get my bank details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bank details' });
  }
});

// Update bank details (OTP no longer required)
// Body: { bankAccountName, bankAccountNumber, ifsc, bankName, upiId }
router.patch('/me/bank-details', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const details = user.bankDetails || {};
    // OTP verification removed: proceed with validation-only update

    const { bankAccountName, bankAccountNumber, ifsc, bankName, upiId } = req.body || {};
    // Basic validation
    if (!bankAccountName || !(ifsc || upiId)) {
      return res.status(400).json({ success: false, message: 'bankAccountName and IFSC or UPI are required' });
    }

    details.bankAccountName = String(bankAccountName).trim();
    if (ifsc) details.ifsc = String(ifsc).trim().toUpperCase();
    if (bankName) details.bankName = String(bankName).trim();
    if (upiId) details.upiId = String(upiId).trim();

    if (bankAccountNumber) {
      const acc = String(bankAccountNumber).replace(/\s+/g, '');
      const last4 = acc.slice(-4);
      details.bankAccountNumberLast4 = last4;
      // Do not store full number in plain text; if you add encryption later, set bankAccountNumberEnc
      details.bankAccountNumberEnc = ''; // placeholder (consider encrypting server-side)
    }

    details.lastUpdatedAt = new Date();
    // Clear legacy OTP markers if present
    details.bankOtp = null;
    details.bankOtpExpires = null;
    user.bankDetails = details;
    user.markModified('bankDetails');
    await user.save();

    const safe = {
      bankAccountName: details.bankAccountName || '',
      bankAccountNumberLast4: details.bankAccountNumberLast4 || '',
      ifsc: details.ifsc || '',
      bankName: details.bankName || '',
      upiId: details.upiId || '',
      verified: !!details.verified,
      lastUpdatedAt: details.lastUpdatedAt || null,
    };
    return res.json({ success: true, message: 'Bank details updated', bankDetails: safe });
  } catch (error) {
    console.error('Update bank details error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update bank details' });
  }
});

// Bank OTP flows removed
router.post('/me/bank/otp/request', authenticate, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Bank OTP flow has been removed.' });
});

router.post('/me/bank/otp/verify', authenticate, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Bank OTP flow has been removed.' });
});

// Get current user's daily problem (today in UTC)
router.get('/me/daily-problem', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('dailyProblem');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, dailyProblem: user.dailyProblem || null });
  } catch (error) {
    console.error('Get daily problem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get daily problem' });
  }
});

// Set today's daily problem (per-user). Body: { problemId }
router.post('/me/daily-problem', authenticate, async (req, res) => {
  try {
    const { problemId } = req.body || {};
    if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required' });
    const user = await User.findById(req.user.id).select('dailyProblem');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(today.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    user.dailyProblem = { date: dateStr, problemId: String(problemId) };
    await user.save();
    return res.json({ success: true, dailyProblem: user.dailyProblem });
  } catch (error) {
    console.error('Set daily problem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set daily problem' });
  }
});

// Streaks: current and max streak based on accepted submissions
router.get('/me/streaks', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    // Pull accepted submissions, only need createdAt
    const subs = await Submission.find({ user: userId, status: 'Accepted' })
      .select('createdAt')
      .sort({ createdAt: 1 })
      .lean();

    // Map to unique UTC date strings (YYYY-MM-DD)
    const toUTCDateStr = (d) => {
      const dt = new Date(d);
      const yyyy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dt.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const uniqueDays = Array.from(new Set(subs.map(s => toUTCDateStr(s.createdAt)))).sort();

    // Compute max streak over all unique days
    let maxStreak = 0;
    let cur = 0;
    let prev = null;
    for (const ds of uniqueDays) {
      const d = new Date(ds + 'T00:00:00Z');
      if (prev) {
        const prevD = new Date(prev + 'T00:00:00Z');
        const diffDays = Math.round((d.getTime() - prevD.getTime()) / (24 * 60 * 60 * 1000));
        cur = (diffDays === 1) ? (cur + 1) : 1;
      } else {
        cur = 1;
      }
      if (cur > maxStreak) maxStreak = cur;
      prev = ds;
    }

    // Compute current streak up to today
    const todayUTC = new Date();
    const todayStr = toUTCDateStr(todayUTC);
    const daySet = new Set(uniqueDays);
    let currentStreak = 0;
    // If there is activity today or yesterday, walk backwards
    // Count consecutive days ending today (or yesterday if today is empty)
    let cursor = daySet.has(todayStr)
      ? new Date(todayStr + 'T00:00:00Z')
      : new Date(new Date(todayStr + 'T00:00:00Z').getTime() - 24 * 60 * 60 * 1000);
    while (true) {
      const cstr = toUTCDateStr(cursor);
      if (daySet.has(cstr)) {
        currentStreak += 1;
        cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    const milestones = {
      d100: maxStreak >= 100,
      d500: maxStreak >= 500,
      d1000: maxStreak >= 1000,
    };

    // Mark reward eligibility for 1000-day streak (best-effort, no email here)
    if (milestones.d1000) {
      try {
        const me = await User.findById(userId).select('rewards');
        if (me) {
          me.rewards = me.rewards || {};
          me.rewards.streak1000 = me.rewards.streak1000 || {};
          if (!me.rewards.streak1000.eligibleAt) {
            me.rewards.streak1000.eligibleAt = new Date();
            await me.save();
          }
        }
      } catch {}
    }

    return res.json({ success: true, currentStreak, maxStreak, milestones });
  } catch (error) {
    console.error('Get streaks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute streaks' });
  }
});

// Daily activity heatmap: accepted submissions per day
router.get('/me/activity', authenticate, async (req, res) => {
  try {
    const days = Math.min(730, Math.max(1, parseInt(String(req.query.days || '365'))));
    const userId = req.user.id;
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - (days - 1));

    // Fetch accepted submissions within window
    const subs = await Submission.find({
      user: userId,
      status: 'Accepted',
      createdAt: { $gte: start, $lte: end }
    }).select('createdAt').lean();

    // Build map dateStr -> count
    const toStr = (d) => {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const counts = new Map();
    subs.forEach(s => {
      const d = new Date(s.createdAt);
      const key = toStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    // Generate full series of days
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime());
      d.setUTCDate(start.getUTCDate() + i);
      const key = toStr(d);
      series.push({ date: key, count: counts.get(key) || 0 });
    }

    return res.json({ success: true, days, start: toStr(start), end: toStr(new Date()), activity: series });
  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

// Get current user's leaderboard rank (server-computed)
// Query params:
// - region: 'all' | any string (matched against user.location, case-insensitive)
// - timeframe: 'all_time' | 'monthly' | 'weekly' (currently only all_time supported)
router.get('/me/leaderboard-rank', authenticate, async (req, res) => {
  try {
    const { region = 'all', timeframe = 'all_time' } = req.query;
    const me = await User.findById(req.user.id).select('points location isAdmin');
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });
    if (me.isAdmin) return res.json({ success: true, rank: null, total: 0, region: String(region), timeframe: String(timeframe), note: 'Admins are excluded from leaderboard' });

    // Build base filter: exclude admins
    const filter = { isAdmin: false };
    if (region && String(region).toLowerCase() !== 'all') {
      filter.location = { $regex: new RegExp(String(region).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    }

    // Timeframe support (placeholder): currently ranks by all_time points
    // If you later track points by timeframe, compute using transactions/activities here.

    // Total users in this scope
    const total = await User.countDocuments(filter);

    // Users with strictly higher points than me (ties share same rank)
    const higher = await User.countDocuments({ ...filter, points: { $gt: me.points || 0 } });
    const rank = total > 0 ? higher + 1 : null;

    return res.json({ success: true, rank, total, region: String(region), timeframe: String(timeframe) });
  } catch (error) {
    console.error('Get leaderboard rank error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute rank' });
  }
});

// Get user profile by username (public)
router.get('/username/:username', optionalAuth, async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username })
      .select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationTokenExpires')
      .populate('solvedProblems', 'title difficulty')
      .populate('contestsParticipated', 'title status');

    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwner = req.user && String(req.user._id || req.user.id) === String(target._id);
    const isAdmin = req.user && req.user.isAdmin;
    const privacy = (target.preferences && target.preferences.privacy) || {};
    const visibility = privacy.profileVisibility || 'public';

    if (isOwner || isAdmin) {
      return res.json({ user: target });
    }

    if (visibility === 'private' || (visibility === 'registered' && !req.user)) {
      const minimal = {
        _id: target._id,
        username: target.username,
        fullName: target.fullName,
        avatarUrl: target.avatarUrl,
        message: visibility === 'private' ? 'This profile is private' : 'This profile is visible to registered users only'
      };
      return res.json({ user: minimal });
    }

    const filtered = target.toObject();
    delete filtered.email;
    delete filtered.resetPasswordToken;
    delete filtered.resetPasswordExpire;
    delete filtered.verificationToken;
    delete filtered.verificationTokenExpires;

    if (privacy.showEmail) {
      filtered.email = target.email;
    }

    if (!privacy.showSolvedProblems) {
      delete filtered.solvedProblems;
      filtered.totalSolved = Array.isArray(target.solvedProblems) ? target.solvedProblems.length : 0;
    }

    if (!privacy.showContestHistory) {
      delete filtered.contestsParticipated;
    }

    if (privacy.showBio === false) {
      delete filtered.bio;
    }

    if (privacy.showSocialLinks === false) {
      delete filtered.website;
      delete filtered.github;
      delete filtered.linkedin;
      delete filtered.twitter;
    }

    return res.json({ user: filtered });
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Multer setup: in-memory storage, 2MB limit, filter images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    if (!ok) return cb(new Error('Only JPG, PNG, WEBP, GIF allowed'));
    cb(null, true);
  }
});

// Optional auth: if Authorization header is present and valid, attach req.user; otherwise continue as guest
function optionalAuth(req, _res, next) {
  try {
    const auth = req.headers?.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_KEY || 'secret');
    // Attach minimal identity for ownership/admin checks
    req.user = {
      id: decoded.id || decoded._id || decoded.sub,
      _id: decoded.id || decoded._id || decoded.sub,
      isAdmin: !!decoded.isAdmin
    };
  } catch (e) {
    // ignore invalid token; treat as anonymous
  }
  return next();
}

// Get leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { 
      limit = 100, 
      sortBy = 'points',
      order = 'desc',
      include = ''
    } = req.query;

    // Validate sort field
    const allowedSortFields = ['points', 'codecoins', 'ranking', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'points';
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build query
    const query = User.find({ isAdmin: false });
    
    // Select fields
    let selectFields = 'username fullName points codecoins ranking avatarUrl avatarPublicId';
    if (include.includes('profile')) {
      selectFields += ' bio location website';
    }
    if (include.includes('solved')) {
      selectFields += ' solvedProblems';
    }

    const users = await query
      .select(selectFields)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .limit(parseInt(limit))
      .lean();

    // Format response
    const response = {
      success: true,
      data: users.map(user => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        points: user.points || 0,
        codecoins: user.codecoins || 0,
        ranking: user.ranking || 0,
        ...(include.includes('solved') && { 
          solvedProblems: user.solvedProblems || [],
          totalSolved: user.solvedProblems?.length || 0 
        }),
        ...(include.includes('profile') && {
          bio: user.bio,
          location: user.location,
          website: user.website
        })
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message 
    });
  }
});

// Upload or update avatar
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If existing avatar, delete it in background
    const prevPublicId = user.avatarPublicId;

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        {
          folder: 'algobucks/avatars',
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      ).end(req.file.buffer);
    });

    const url = uploadResult.secure_url;
    const publicId = uploadResult.public_id;

    user.avatarUrl = url || '';
    user.avatarPublicId = publicId || '';
    await user.save();

    // Best-effort delete previous
    if (prevPublicId && prevPublicId !== publicId) {
      cloudinary.v2.uploader.destroy(prevPublicId).catch(() => {});
    }

    const payload = user.toJSON();
    return res.json({ success: true, message: 'Avatar updated', user: payload });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload avatar' });
  }
});

// Delete avatar
router.delete('/me/avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const publicId = user.avatarPublicId;
    user.avatarUrl = '';
    user.avatarPublicId = '';
    await user.save();

    if (publicId) {
      cloudinary.v2.uploader.destroy(publicId).catch(() => {});
    }

    return res.json({ success: true, message: 'Avatar removed', user: user.toJSON() });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete avatar' });
  }
});

// Get user profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const target = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationTokenExpires')
      .populate('solvedProblems', 'title difficulty')
      .populate('contestsParticipated', 'title status');

    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwner = req.user && String(req.user._id || req.user.id) === String(target._id);
    const isAdmin = req.user && req.user.isAdmin;
    const privacy = (target.preferences && target.preferences.privacy) || {};
    const visibility = privacy.profileVisibility || 'public';

    // Owner or admin: return full safe profile
    if (isOwner || isAdmin) {
      return res.json({ user: target });
    }

    // If profile is private or registered-only (and requester is guest), restrict aggressively
    if (visibility === 'private' || (visibility === 'registered' && !req.user)) {
      const minimal = {
        _id: target._id,
        username: target.username,
        fullName: target.fullName,
        avatarUrl: target.avatarUrl,
        message: visibility === 'private' ? 'This profile is private' : 'This profile is visible to registered users only'
      };
      return res.json({ user: minimal });
    }

    // Public view: filter based on granular privacy settings
    const filtered = target.toObject();
    // Always remove sensitive fields
    delete filtered.email; // default hide, re-add if showEmail
    delete filtered.resetPasswordToken;
    delete filtered.resetPasswordExpire;
    delete filtered.verificationToken;
    delete filtered.verificationTokenExpires;

    if (privacy.showEmail) {
      filtered.email = target.email;
    }

    if (!privacy.showSolvedProblems) {
      // Remove detailed solvedProblems but keep count if present
      delete filtered.solvedProblems;
      // Optionally expose only a count
      filtered.totalSolved = Array.isArray(target.solvedProblems) ? target.solvedProblems.length : 0;
    }

    if (!privacy.showContestHistory) {
      delete filtered.contestsParticipated;
    }

    if (privacy.showBio === false) {
      delete filtered.bio;
    }

    if (privacy.showSocialLinks === false) {
      delete filtered.website;
      delete filtered.github;
      delete filtered.linkedin;
      delete filtered.twitter;
    }

    return res.json({ user: filtered });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'email',
      'fullName', 'bio', 'location', 'website', 
      'github', 'linkedin', 'twitter', 'company',
      'school'
    ];

    // Filter updates to only include allowed fields
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        if (updates[key] !== undefined) {  // Only include if value is not undefined
          obj[key] = updates[key];
        }
        return obj;
      }, {});

    // If no valid updates, return bad request
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Find user first
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    Object.keys(filteredUpdates).forEach(update => {
      user[update] = filteredUpdates[update];
    });

    // Save the updated user
    await user.save();

    // Prepare user data to return (without sensitive info)
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user preferences (e.g., preferredCurrency)
router.patch('/me/preferences', authenticate, async (req, res) => {
  try {
    const { preferredCurrency, preferences } = req.body;
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'INR'];

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (preferredCurrency) {
      if (!allowedCurrencies.includes(preferredCurrency)) {
        return res.status(400).json({ success: false, message: 'Unsupported currency' });
      }
      user.preferredCurrency = preferredCurrency;
    }

    if (preferences && typeof preferences === 'object') {
      // Merge allowed preference fields only
      user.preferences = user.preferences || {};
      const p = preferences;
      if (p.theme && ['light', 'dark', 'auto'].includes(p.theme)) user.preferences.theme = p.theme;
      if (typeof p.language === 'string') user.preferences.language = p.language;
      if (typeof p.timezone === 'string') user.preferences.timezone = p.timezone;
      if (p.defaultCodeLanguage && ['javascript', 'python', 'java', 'cpp'].includes(p.defaultCodeLanguage)) {
        user.preferences.defaultCodeLanguage = p.defaultCodeLanguage;
      }
      if (p.notifications && typeof p.notifications === 'object') {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...['emailNotifications','contestReminders','submissionResults','weeklyDigest','marketingEmails']
            .reduce((acc, key) => {
              if (typeof p.notifications[key] === 'boolean') acc[key] = p.notifications[key];
              return acc;
            }, {})
          ,
          ...(typeof p.notifications.frequency === 'string' && ['immediate','daily','weekly','none'].includes(p.notifications.frequency) ? { frequency: p.notifications.frequency } : {}),
          ...(typeof p.notifications.digestTime === 'string' ? { digestTime: p.notifications.digestTime } : {})
        };
      }
      if (p.privacy && typeof p.privacy === 'object') {
        user.preferences.privacy = {
          ...user.preferences.privacy,
          ...(p.privacy.profileVisibility && ['public','registered','private'].includes(p.privacy.profileVisibility) ? { profileVisibility: p.privacy.profileVisibility } : {}),
          ...(typeof p.privacy.showEmail === 'boolean' ? { showEmail: p.privacy.showEmail } : {}),
          ...(typeof p.privacy.showSolvedProblems === 'boolean' ? { showSolvedProblems: p.privacy.showSolvedProblems } : {}),
          ...(typeof p.privacy.showContestHistory === 'boolean' ? { showContestHistory: p.privacy.showContestHistory } : {}),
          ...(typeof p.privacy.showBio === 'boolean' ? { showBio: p.privacy.showBio } : {}),
          ...(typeof p.privacy.showSocialLinks === 'boolean' ? { showSocialLinks: p.privacy.showSocialLinks } : {}),
        };
      }
      if (p.editor && typeof p.editor === 'object') {
        user.preferences.editor = {
          ...user.preferences.editor,
          ...(typeof p.editor.fontSize === 'number' ? { fontSize: p.editor.fontSize } : {}),
          ...(typeof p.editor.tabSize === 'number' ? { tabSize: p.editor.tabSize } : {}),
          ...(typeof p.editor.theme === 'string' && ['light','vs-dark'].includes(p.editor.theme) ? { theme: p.editor.theme } : {}),
        };
      }
      if (p.accessibility && typeof p.accessibility === 'object') {
        user.preferences.accessibility = {
          ...user.preferences.accessibility,
          ...(typeof p.accessibility.reducedMotion === 'boolean' ? { reducedMotion: p.accessibility.reducedMotion } : {}),
          ...(typeof p.accessibility.highContrast === 'boolean' ? { highContrast: p.accessibility.highContrast } : {}),
        };
      }
    }

    await user.save();

    const payload = user.toJSON();
    return res.json({ success: true, message: 'Preferences updated', user: payload });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update preferences' });
  }
});

// --- Email change via OTP ---
// Step 1: Request change (send OTP to new email)

// Change password
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Current and new password (min 6 chars) are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update password' });
  }
});

router.post('/me/email/change/request', authenticate, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Email change OTP flow is disabled.' });
});

// Get user activity (per-day accepted submission counts)
// (Removed duplicate '/users/me/activity' route)

router.post('/me/email/change/verify', authenticate, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Email change OTP flow is disabled.' });
});

// Permanently delete the authenticated user's account
router.delete('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const publicId = user.avatarPublicId;

    await User.deleteOne({ _id: user._id });

    if (publicId) {
      cloudinary.v2.uploader.destroy(publicId).catch(() => {});
    }

    // TODO: If you have related collections (submissions, discussions, etc.),
    // you may want to anonymize or delete those here as well.

    return res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete account' });
  }
});

export default router;