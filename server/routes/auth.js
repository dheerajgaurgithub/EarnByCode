import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
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

// ----------------------- Forgot Password via OTP -----------------------
// Email sender (Nodemailer if configured, else log to file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../..', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  try { fs.mkdirSync(LOGS_DIR, { recursive: true }); } catch {}
}

const transporter = (() => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
    }
  } catch (e) {
    console.error('Failed to init SMTP transporter:', e);
  }
  return null;
})();

const sendEmailOrLog = async ({ to, subject, html, text }) => {
  try {
    if (transporter) {
      const from = process.env.EMAIL_FROM || 'no-reply@algobucks.app';
      await transporter.sendMail({ from, to, subject, html, text });
      return { delivered: true };
    }
  } catch (e) {
    console.error('Email send failed, falling back to log:', e);
  }
  // Fallback: log email content
  try {
    const logFile = path.join(LOGS_DIR, 'email-logs.json');
    const logData = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
    const entry = { timestamp: new Date().toISOString(), to, subject, html: html?.slice(0, 2000), text: text?.slice(0, 2000), type: 'forgot_password_otp' };
    logData.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    return { delivered: false, logged: true };
  } catch (e) {
    console.error('Failed to log email:', e);
  }
  return { delivered: false };
};

// Forgot Password: Request OTP
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Cooldown per email
    if (isCoolingDown(cooldowns.forgot, email)) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    // Respond with 200 to avoid email enumeration even if user not found
    if (!user) {
      setCooldown(cooldowns.forgot, email);
      return res.json({ success: true, message: 'If the email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP and store hash in resetPasswordToken
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordToken = otpHash;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const subject = 'Your AlgoBucks password reset code';
    const text = `Your password reset code is ${otp}. It expires in 15 minutes.`;
    const html = `<p>Use the following code to reset your password:</p><h2 style="font-family:monospace">${otp}</h2><p>This code expires in 15 minutes.</p>`;
    // Fire-and-forget to avoid delaying the response due to slow SMTP
    Promise.resolve().then(() => sendEmailOrLog({ to: user.email, subject, text, html })).catch((e) => {
      console.error('Background email/log failed:', e);
    });

    setCooldown(cooldowns.forgot, email);
    return res.json({ success: true, message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot-password request error:', error);
    return res.status(500).json({ message: 'Failed to process request' });
  }
});

// Forgot Password: Verify OTP (optional pre-check)
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired code' });
    }
    if (new Date(user.resetPasswordExpire).getTime() < Date.now()) {
      return res.status(400).json({ valid: false, message: 'Code expired' });
    }
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (hash !== user.resetPasswordToken) {
      return res.status(400).json({ valid: false, message: 'Invalid code' });
    }
    return res.json({ valid: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Forgot-password verify error:', error);
    return res.status(500).json({ message: 'Failed to verify code' });
  }
});

// Forgot Password: Reset with OTP
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and newPassword are required' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    if (new Date(user.resetPasswordExpire).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Code expired' });
    }
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (hash !== user.resetPasswordToken) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    // Set new password; pre-save hook will hash if needed
    user.password = String(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Forgot-password reset error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;