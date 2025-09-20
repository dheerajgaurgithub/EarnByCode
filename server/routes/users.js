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
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('solvedProblems', 'title difficulty')
      .populate('contestsParticipated', 'title status');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
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

export default router;