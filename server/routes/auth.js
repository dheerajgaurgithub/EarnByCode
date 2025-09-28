import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config/config.js';
import { authenticate } from '../middleware/auth.js';

// Helper: is user currently blocked (without modifying DB)
const isCurrentlyBlocked = (user) => {
  if (!user?.isBlocked) return false;
  if (!user.blockedUntil) return true; // blocked indefinitely until admin clears
  return new Date(user.blockedUntil).getTime() > Date.now();
};

// Helper: auto-unblock user if block has expired
const autoUnblockIfExpired = async (user) => {
  try {
    if (!user?.isBlocked) return user;
    if (!user.blockedUntil) return user; // indefinite block
    const now = Date.now();
    const until = new Date(user.blockedUntil).getTime();
    if (until <= now) {
      // Clear block fields
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isBlocked: false,
          blockReason: '',
          blockedUntil: null,
          blockDuration: undefined,
          blockDurationUnit: undefined,
        },
        $push: {
          blockHistory: {
            unblockedAt: new Date(),
            action: 'auto_unblock',
            reason: 'Block expired'
          }
        }
      });

// Debug email/OTP endpoints removed
      // Reload the user to reflect updates
      const refreshed = await User.findById(user._id);
      return refreshed || user;
    }
    return user;
  } catch (e) {
    console.error('Auto-unblock check failed:', e);
    return user; // fail-safe: do not modify block state on error
  }
};

const router = express.Router();

// Helpers
const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
// OTP flows disabled

// In-memory cooldown maps (per email)
const cooldowns = {
  resend: new Map(), // registration verification resend
  forgot: new Map(), // forgot-password request
};
const COOLDOWN_MS = 60 * 1000; // 60 seconds
const isCoolingDown = (map, email) => {
  const now = Date.now();
  const last = map.get(email);
  return typeof last === 'number' && (now - last) < COOLDOWN_MS;
};
const setCooldown = (map, email) => map.set(email, Date.now());

// Register: create PendingUser and send verification OTP
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    // Check existing
    const existingUser = await User.findOne({ $or: [{ email: String(email).toLowerCase() }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: existingUser.email === String(email).toLowerCase() ? 'Email already registered' : 'Username already taken' });
    }
    // Create real user directly (assumes pre-save hashing on User model)
    const user = new User({
      username,
      email: String(email).toLowerCase(),
      password: String(password),
      fullName,
      isEmailVerified: true,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    return res.status(201).json({ message: 'Registration successful', token, user: user.toJSON() });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Resend verification OTP for pending registration
router.post('/resend-verification', async (_req, res) => {
  return res.status(410).json({ message: 'Email verification via OTP has been disabled.' });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Blocked check with auto-unblock if expired
    const maybeUnblockedUser = await autoUnblockIfExpired(user);
    if (isCurrentlyBlocked(maybeUnblockedUser)) {
      return res.status(403).json({
        message: 'Your account is blocked by admin',
        blocked: true,
        reason: maybeUnblockedUser.blockReason || 'Policy violation',
        blockedUntil: maybeUnblockedUser.blockedUntil,
        duration: maybeUnblockedUser.blockDuration || null,
        durationUnit: maybeUnblockedUser.blockDurationUnit || null,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: (maybeUnblockedUser._id || user._id) },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        ...(maybeUnblockedUser.toJSON ? maybeUnblockedUser.toJSON() : user.toJSON()),
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .populate('solvedProblems', 'title difficulty')
      .populate('contestsParticipated', 'title status');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Auto-clear block if expired
    user = await autoUnblockIfExpired(user);
    const blocked = isCurrentlyBlocked(user);
    
    res.json({ 
      user: {
        ...user.toJSON(),
        blocked,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = [
      'fullName', 'bio', 'location', 'website', 'github', 
      'linkedin', 'twitter', 'company', 'school'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Verify email with OTP and create final user
router.post('/verify-email', async (_req, res) => {
  return res.status(410).json({ message: 'Email verification via OTP has been disabled.' });
});

// Verify account after clicking email link (used for Google welcome link)
// Requires a valid Bearer token (the link we email contains a token)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isEmailVerified) {
      return res.json({ success: true, message: 'Email already verified', user: user.toJSON() });
    }
    user.isEmailVerified = true;
    await user.save();
    return res.json({ success: true, message: 'Email verified successfully', user: user.toJSON() });
  } catch (error) {
    console.error('Verify account error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify account' });
  }
});

// Email verification link handler: GET with token in query
// Example: GET /api/auth/verify-link?token=...&next=%2F&welcome=1
router.get('/verify-link', async (_req, res) => {
  return res.status(410).send('Email verification is disabled.');
});

      
// Google OAuth routes are handled in oauth.js

// Forgot Password: Request OTP
router.post('/forgot-password/request', async (_req, res) => {
  return res.status(410).json({ message: 'Password reset via OTP has been disabled.' });
});

// Forgot Password: Verify OTP
router.post('/forgot-password/verify', async (_req, res) => {
  return res.status(410).json({ message: 'Password reset via OTP has been disabled.' });
});

// Forgot Password: Reset with OTP
router.post('/forgot-password/reset', async (_req, res) => {
  return res.status(410).json({ message: 'Password reset via OTP has been disabled.' });
});

export default router;