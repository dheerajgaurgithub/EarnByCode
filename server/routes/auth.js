import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import config from '../config/config.js';
import { sendEmail } from '../utils/email.js';
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
const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const hashToken = (val) => crypto.createHash('sha256').update(String(val)).digest('hex');

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

    // Check for existing in final users
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: existingUser.email === email ? 'Email already registered' : 'Username already taken' });
    }

    // Also ensure no conflicting pending registration
    const existingPending = await PendingUser.findOne({ $or: [{ email }, { username }] });
    if (existingPending) {
      // Allow re-initiate by deleting prior pending (same email/username)
      await PendingUser.deleteOne({ _id: existingPending._id }).catch(() => {});
    }

    // Hash password now and store only the hash in PendingUser
    const passwordHash = await bcrypt.hash(String(password), 12);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const pending = new PendingUser({ username, email: String(email).toLowerCase(), passwordHash, fullName, otp, expiresAt });
    await pending.save();

    // Send verification email with OTP
    console.log('[Auth] Sending register OTP', { email, provider: process.env.EMAIL_PROVIDER || (process.env.SMTP_USER ? 'smtp' : 'none') });
    const istNow = new Date(Date.now() + 330 * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await sendEmail({
      to: email,
      subject: 'Verify your AlgoBucks account',
      text: `Your verification code is ${otp}. It expires in 60 minutes.\nSent (IST): ${istNow}`,
      html: `<p>Thanks for registering on <b>AlgoBucks</b>!</p><p>Your verification code is:</p><h2 style=\"letter-spacing:4px;\">${otp}</h2><p>This code expires in 60 minutes.</p><p style=\"color:#666;\">Sent (IST): ${istNow}</p>`
    });

    return res.status(201).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      requiresVerification: true,
      ...(isProd ? {} : { testOtp: otp })
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
    if (!email) return res.status(400).json({ message: 'email is required' });
    const emailKey = String(email).toLowerCase();
    if (isCoolingDown(cooldowns.resend, emailKey)) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - cooldowns.resend.get(emailKey))) / 1000);
      return res.status(429).json({ message: `Please wait ${remaining}s before requesting a new code.` });
    }
    const pending = await PendingUser.findOne({ email: String(email).toLowerCase() });
    if (!pending) return res.status(404).json({ message: 'No pending registration found for this email' });

    const otp = generateOTP();
    pending.otp = otp;
    pending.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pending.save();

    console.log('[Auth] Resend verification OTP', { email, provider: process.env.EMAIL_PROVIDER || (process.env.SMTP_USER ? 'smtp' : 'none') });
    const istNow2 = new Date(Date.now() + 330 * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await sendEmail({
      to: email,
      subject: 'Your AlgoBucks verification code',
      text: `Your verification code is ${otp}. It expires in 60 minutes.\nSent (IST): ${istNow2}`,
      html: `<p>Your verification code is:</p><h2 style=\"letter-spacing:4px;\">${otp}</h2><p>This code expires in 60 minutes.</p><p style=\"color:#666;\">Sent (IST): ${istNow2}</p>`
    });
    setCooldown(cooldowns.resend, emailKey);

    return res.json({ message: 'Verification code resent', requiresVerification: true, ...(isProd ? {} : { testOtp: otp }) });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Failed to resend verification code' });
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

// Verify email with OTP and create final user
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required' });

    const pending = await PendingUser.findOne({ email: String(email).toLowerCase() });
    if (!pending) return res.status(404).json({ message: 'No pending registration found' });
    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await PendingUser.deleteOne({ _id: pending._id }).catch(() => {});
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }
    if (String(pending.otp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Create the real user
    const user = new User({
      username: pending.username,
      email: pending.email,
      password: pending.passwordHash, // pre-hashed
      fullName: pending.fullName,
      isEmailVerified: true,
    });
    await user.save();

    // Remove pending record
    await PendingUser.deleteOne({ _id: pending._id }).catch(() => {});

    // Issue token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    return res.json({ success: true, message: 'Email verified successfully', token, user: user.toJSON() });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
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
router.get('/verify-link', async (req, res) => {
  try {
    const { token, next = '/' } = req.query;
    if (!token) {
      return res.status(400).send('Invalid verification link');
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).send('Verification link expired or invalid');
    }
    const userId = payload.userId || payload.id || payload._id;
    if (!userId) {
      return res.status(400).send('Invalid token payload');
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    // Redirect to frontend callback so SPA can persist token and show welcome
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';
    const callbackUrl = new URL('/auth/callback', frontendUrl);
    const urlWithHash = new URL(callbackUrl);
    const nextParam = encodeURIComponent(next || '/');
    urlWithHash.hash = `#token=${token}&next=${nextParam}&welcome=1`;
    return res.redirect(urlWithHash.toString());
  } catch (error) {
    console.error('Verify-link error:', error);
    return res.status(500).send('Failed to verify account');
  }
});

      
// Google OAuth routes are handled in oauth.js

// Forgot Password: Request OTP
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required' });
    const emailKey = String(email).toLowerCase();
    const user = await User.findOne({ email: emailKey });
    // For security, always respond success; but only set token if user exists
    if (user) {
      if (isCoolingDown(cooldowns.forgot, emailKey)) {
        // Respond success without sending a new email, to avoid enumeration & abuse
        return res.json({ message: 'If an account exists, an OTP has been sent to your email.' });
      }
      const otp = generateOTP();
      user.resetPasswordToken = hashToken(otp);
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      console.log('[Auth] Forgot-password OTP', { email, provider: process.env.EMAIL_PROVIDER || (process.env.SMTP_USER ? 'smtp' : 'none') });
      const istNow3 = new Date(Date.now() + 330 * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      await sendEmail({
        to: email,
        subject: 'Your AlgoBucks password reset code',
        text: `Use this code to reset your password: ${otp}. It expires in 15 minutes.\nSent (IST): ${istNow3}`,
        html: `<p>Use this code to reset your password:</p><h2 style=\"letter-spacing:4px;\">${otp}</h2><p>This code expires in 15 minutes.</p><p style=\"color:#666;\">Sent (IST): ${istNow3}</p>`
      });
      setCooldown(cooldowns.forgot, emailKey);

      return res.json({ message: 'If an account exists, an OTP has been sent to your email.', ...(isProd ? {} : { testOtp: otp }) });
    }
    return res.json({ message: 'If an account exists, an OTP has been sent to your email.' });
  } catch (error) {
    console.error('Forgot-password request error:', error);
    return res.status(500).json({ message: 'Failed to process request' });
  }
});

// Forgot Password: Verify OTP
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required' });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const valid = user.resetPasswordToken === hashToken(otp) && new Date(user.resetPasswordExpire).getTime() > Date.now();
    if (!valid) return res.status(400).json({ message: 'Invalid or expired OTP' });
    return res.json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Forgot-password verify error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Forgot Password: Reset with OTP
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'email, otp and newPassword are required' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const valid = user.resetPasswordToken === hashToken(otp) && new Date(user.resetPasswordExpire).getTime() > Date.now();
    if (!valid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = String(newPassword); // will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot-password reset error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;