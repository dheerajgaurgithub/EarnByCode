import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from 'cloudinary';

// Configure Cloudinary from environment
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

const router = express.Router();

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
    let selectFields = 'username fullName points codecoins ranking';
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

export default router;