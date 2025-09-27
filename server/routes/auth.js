import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';
import config from '../config/config.js';

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

// Debug: fetch current OTP for a pending user (for local/testing only)
router.get('/debug/pending-otp', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: 'Missing email' });

    const debugKey = process.env.DEBUG_EMAIL_TEST_KEY || '';
    const isProd = (process.env.NODE_ENV || config.NODE_ENV) === 'production';
    if (isProd && debugKey) {
      const hdr = String(req.headers['x-debug-key'] || '');
      if (hdr !== debugKey) {
        return res.status(403).json({ ok: false, message: 'Forbidden: invalid debug key' });
      }
    } else if (isProd && !debugKey) {
      return res.status(403).json({ ok: false, message: 'Forbidden in production (set DEBUG_EMAIL_TEST_KEY to allow with header x-debug-key)' });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json({ ok: false, message: 'No pending registration for this email' });
    return res.status(200).json({ ok: true, email, otp: pending.otp, expiresAt: pending.expiresAt });
  } catch (e) {
    console.error('Debug get pending OTP error:', e);
    return res.status(500).json({ ok: false, message: String(e?.message || e) });
  }
});

// Debug: send a test email and report which provider was used
router.post('/debug/send-test-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {};

    if (!to) return res.status(400).json({ ok: false, message: 'Missing `to` email' });

    const debugKey = process.env.DEBUG_EMAIL_TEST_KEY || '';
    const isProd = (process.env.NODE_ENV || config.NODE_ENV) === 'production';
    if (isProd && debugKey) {
      const hdr = String(req.headers['x-debug-key'] || '');
      if (hdr !== debugKey) {
        return res.status(403).json({ ok: false, message: 'Forbidden: invalid debug key' });
      }
    } else if (isProd && !debugKey) {
      return res.status(403).json({ ok: false, message: 'Forbidden in production (set DEBUG_EMAIL_TEST_KEY to allow with header x-debug-key)' });
    }

    const s = await sendEmail({
      to,
      subject: subject || 'EarnByCode Test Email',
      text: text || 'This is a test email from EarnByCode server.',
      html: html || '<p>This is a <strong>test email</strong> from EarnByCode server.</p>',
    });
    return res.status(200).json({ ok: true, provider: s?.provider || 'unknown' });
  } catch (e) {
    console.error('Debug test email error:', e);
    return res.status(500).json({ ok: false, message: String(e?.message || e) });
  }
});
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

// Helper function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const router = express.Router();

// --- Simple in-memory attempt tracking for OTP requests (email/IP) ---
const otpAttemptByEmail = new Map(); // email -> timestamps[]
const otpAttemptByIp = new Map();    // ip -> timestamps[]
const pushAttempt = (map, key) => {
  const now = Date.now();
  const arr = map.get(key) || [];
  arr.push(now);
  // keep last 50 and within 10 minutes
  const cutoff = now - 10 * 60 * 1000;
  const trimmed = arr.filter(t => t >= cutoff).slice(-50);
  map.set(key, trimmed);
  return trimmed;
};
const countRecent = (map, key) => {
  const now = Date.now();
  const cutoff = now - 10 * 60 * 1000;
  const arr = map.get(key) || [];
  return arr.filter(t => t >= cutoff).length;
};

// Register (store in PendingUser until OTP verified)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if verified user already exists with email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password for pending record
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP (expires in 1 hour)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Upsert PendingUser (so resubmits refresh OTP)
    const pending = await PendingUser.findOneAndUpdate(
      { $or: [{ email }, { username }] },
      { username, email, passwordHash, fullName, otp, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Respond immediately to avoid client/network timeouts
    res.status(201).json({
      message: 'Verification email sent. Please check your email to verify your account.',
      requiresVerification: true,
      email,
      username
    });

    setImmediate(async () => {
      try {
        const subject = process.env.EMAIL_SUBJECT_VERIFY || 'EarnByCode: Verify your email';
        const text = `Welcome to EarnByCode! Your verification code is ${otp}. It expires in 60 minutes.`;
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Verify your email</h2>
            <p>Use the following code to verify your email for <strong>EarnByCode</strong>:</p>
            <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">${otp}</p>
            <p style="color:#555">This code expires in <strong>60 minutes</strong>.</p>
          </div>
        `;
        const sent = await sendEmail({ to: email, subject, text, html });
        try { console.log(`[email] register OTP sent via provider=${sent?.provider || 'unknown'}`); } catch {}
      } catch (e) {
        console.error('Send verification email (background) error:', e);
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Resend verification OTP for pending registration
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // If already verified, do not proceed
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    const otp = generateOTP();
    pending.otp = otp;
    pending.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pending.save();

    // Respond immediately to avoid client/network timeouts
    res.status(200).json({ message: 'Verification email re-sent', requiresVerification: true });

    // Send email in background
    setImmediate(async () => {
      try {
        const subject = process.env.EMAIL_SUBJECT_VERIFY || 'EarnByCode: Verify your email';
        const text = `Your new verification code is ${otp}. It expires in 60 minutes.`;
        const html = `
          <div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">\n\
            <h2>Verify your email</h2>\n\
            <p>Use the following code to verify your email for <strong>EarnByCode</strong>:</p>\n\
            <p style=\"font-size: 22px; font-weight: 700; letter-spacing: 2px;\">${otp}</p>\n\
            <p style=\"color:#555\">This code expires in <strong>60 minutes</strong>.</p>\n\
          </div>
        `;
        const sent = await sendEmail({ to: email, subject, text, html });
        try { console.log(`[email] resend OTP sent via provider=${sent?.provider || 'unknown'}`); } catch {}
      } catch (e) {
        console.error('Resend verification email (background) error:', e);
      }
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error during resend verification' });
  }
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

// Verify Email with OTP (create real User on success)
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find pending record
    const pending = await PendingUser.findOne({ email, otp, expiresAt: { $gt: new Date() } });
    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Final collision check prior to creating user
    const collision = await User.findOne({ $or: [{ email }, { username: pending.username }] });
    if (collision) {
      await PendingUser.deleteOne({ _id: pending._id }).catch(() => {});
      return res.status(400).json({ message: 'Email or username already registered' });
    }

    // Create real user using hashed password
    const user = new User({
      username: pending.username,
      email: pending.email,
      password: pending.passwordHash, // pre-hashed; model pre-save will skip rehash
      fullName: pending.fullName,
      ranking: await User.countDocuments() + 1,
      isEmailVerified: true,
    });
    await user.save();
    await PendingUser.deleteOne({ _id: pending._id }).catch(() => {});

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

      
// Google OAuth routes are handled in oauth.js

// Resend Verification Email
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Throttle by IP and email
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
    if (countRecent(otpAttemptByIp, ip) >= 30) {
      return res.status(429).json({ message: 'Too many requests from this IP. Try again later.' });
    }
    if (countRecent(otpAttemptByEmail, String(email).toLowerCase()) >= 5) {
      return res.status(429).json({ message: 'Too many OTP requests for this email. Try again later.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'This email is not registered' });
    }
    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is not verified. Please verify your email first.' });
    }

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    try {
      const subject = process.env.EMAIL_SUBJECT_RESET || 'EarnByCode: Password reset code';
      const text = `Your password reset code is ${otp}. It expires in 15 minutes.`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password reset</h2>
          <p>Use the code below to reset your password for <strong>EarnByCode</strong>:</p>
          <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">${otp}</p>
          <p style="color:#555">This code expires in <strong>15 minutes</strong>.</p>
        </div>
      `;
      await sendEmail({ to: email, subject, text, html });
    } catch (e) {
      console.error('Send reset OTP email error:', e);
      return res.status(500).json({ message: 'Failed to send reset code. Please try again later.' });
    }

    // Record successful attempt
    pushAttempt(otpAttemptByIp, ip);
    pushAttempt(otpAttemptByEmail, String(email).toLowerCase());

    return res.status(200).json({ message: 'OTP has been sent to your verified email' });
  } catch (error) {
    console.error('Forgot password request error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});
// Step 2: Verify OTP (optional separate step)
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email, resetPasswordToken: otp, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    return res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Forgot password verify error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Step 3: Reset password with valid OTP
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP and newPassword are required' });

    const user = await User.findOne({ email, resetPasswordToken: otp, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;