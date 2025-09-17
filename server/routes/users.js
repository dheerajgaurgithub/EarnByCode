import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for avatar uploads with disk storage to preserve extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    let selectFields = 'username fullName avatar points codecoins ranking';
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
        avatar: user.avatar,
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
      'school', 'avatar'
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

// Get user's current avatar
router.get('/me/avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('avatar');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      avatar: user.avatar || null
    });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Handle avatar upload
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or invalid file type. Only JPG, PNG, and GIF are allowed.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      // Clean up the uploaded file if user not found
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user had a previous avatar, delete it
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlink(oldAvatarPath, (err) => {
          if (err) console.error('Error deleting old avatar:', err);
        });
      }
    }

    // Construct the relative and absolute URLs to the uploaded file
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://algobucks.onrender.com' 
      : 'http://localhost:5000';
    const absoluteUrl = `${baseUrl}${relativeUrl}`;
    
    // Update user's avatar with the relative URL
    user.avatar = relativeUrl;
    await user.save();

    // Prepare user object for response
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpire;

    // Include both relative and absolute URLs in the response
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: relativeUrl, // Relative URL for storage
      avatarUrl: absoluteUrl, // Full URL for immediate use
      user: {
        ...userObj,
        avatar: absoluteUrl // Update user object with full URL
      }
    });
  } catch (error) {
    // Clean up the uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete avatar
router.delete('/me/avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has an avatar, delete the file
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../../public', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlink(avatarPath, (err) => {
          if (err) console.error('Error deleting avatar file:', err);
        });
      }
      
      // Clear the avatar field
      user.avatar = undefined;
      await user.save();
    }

    // Prepare user object for response
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;

    res.json({
      success: true,
      message: 'Avatar removed successfully',
      user: userObj
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint to verify avatar upload and serving
router.get('/test-avatar', (req, res) => {
  const testAvatarPath = path.join(__dirname, '../../public/uploads/avatars/test-avatar.jpg');
  
  // Check if test avatar exists
  if (fs.existsSync(testAvatarPath)) {
    return res.json({
      success: true,
      message: 'Test avatar exists',
      url: '/uploads/avatars/test-avatar.jpg'
    });
  }
  
  // If test avatar doesn't exist, create one
  try {
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    fs.writeFileSync(testAvatarPath, testImage);
    
    // Verify file was created
    const fileExists = fs.existsSync(testAvatarPath);
    const stats = fileExists ? fs.statSync(testAvatarPath) : null;
    
    res.json({
      success: true,
      message: 'Test avatar created',
      path: testAvatarPath,
      url: '/uploads/avatars/test-avatar.jpg',
      fileExists,
      fileSize: stats?.size,
      isFile: stats?.isFile(),
      isDirectory: stats?.isDirectory(),
      permissions: {
        read: fs.constants.R_OK ? 'OK' : 'Failed',
        write: fs.constants.W_OK ? 'OK' : 'Failed',
        execute: fs.constants.X_OK ? 'OK' : 'Failed'
      },
      directories: {
        uploads: {
          exists: uploadsDirExists,
          path: uploadsDir,
          writable: (() => {
            try {
              fs.accessSync(uploadsDir, fs.constants.W_OK);
              return true;
            } catch (e) {
              return false;
            }
          })()
        },
        avatars: {
          exists: avatarsDirExists,
          path: avatarsDir,
          writable: (() => {
            try {
              fs.accessSync(avatarsDir, fs.constants.W_OK);
              return true;
            } catch (e) {
              return false;
            }
          })()
        }
      }
    });
  } catch (error) {
    console.error('Error creating test avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test avatar',
      error: error.message,
      path: testAvatarPath,
      directories: {
        uploads: {
          exists: uploadsDirExists,
          path: uploadsDir
        },
        avatars: {
          exists: avatarsDirExists,
          path: avatarsDir
        }
      }
    });
  }
});

export default router;