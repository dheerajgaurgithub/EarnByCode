import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import config from '../config/config.js';
import { authenticate } from '../middleware/auth.js';
import { sendOTPEmail } from '../utils/email.js';

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

// Register: create user and send verification OTP if email verification is enabled
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    
    // Check existing user
    const existingUser = await User.findOne({ 
      $or: [
        { email: String(email).toLowerCase() }, 
        { username }
      ] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === String(email).toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }
    
    const normalizedEmail = String(email).toLowerCase();
    
    // Check if email verification is required
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    
    // Create user
    const user = new User({
      username,
      email: normalizedEmail,
      password: String(password),
      fullName,
      isEmailVerified: !requireEmailVerification, // Auto-verify if not required
    });
    
    await user.save();
    
    // If email verification is required, send OTP
    if (requireEmailVerification) {
      try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        
        // Store OTP in user record
        user.verificationToken = otpHash;
        user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        
        // Send OTP email
        const emailResult = await sendOTPEmail(normalizedEmail, otp, 'email-verification');
        
        console.log('📧 Verification OTP sent:', emailResult);
        
        return res.status(201).json({
          message: 'Registration successful! Please check your email for verification code.',
          requiresVerification: true,
          email: normalizedEmail,
          ...((!isProd || process.env.OTP_DEBUG === 'true') ? { debugOtp: otp } : {})
        });
        
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        
        // If email fails, still create the user but mark as unverified
        return res.status(201).json({
          message: 'Registration successful! However, we could not send the verification email. Please contact support.',
          requiresVerification: true,
          emailError: true
        });
      }
    } else {
      // Auto-login if verification not required
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      return res.status(201).json({ 
        message: 'Registration successful', 
        token, 
        user: user.toJSON() 
      });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(200).json({ message: 'Email already verified' });
    }
    
    if (!user.verificationToken || !user.verificationTokenExpires) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    
    if (new Date(user.verificationTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }
    
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (otpHash !== user.verificationToken) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Verify the user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    
    // Generate login token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    return res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Server error during verification' });
  }
});

// Resend verification OTP
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const normalizedEmail = String(email).toLowerCase();
    
    // Cooldown check
    if (isCoolingDown(cooldowns.resend, normalizedEmail)) {
      return res.status(429).json({ message: 'Please wait before requesting another code' });
    }
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if user exists
      setCooldown(cooldowns.resend, normalizedEmail);
      return res.status(200).json({ message: 'If the email exists, a verification code has been sent.' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    try {
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      
      // Update user record
      user.verificationToken = otpHash;
      user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Send OTP email in background to avoid blocking response
      setImmediate(async () => {
        try {
          const emailResult = await sendOTPEmail(normalizedEmail, otp, 'email-verification');
          console.log('📧 Verification OTP resent (bg):', emailResult);
        } catch (emailError) {
          console.error('Failed to resend verification email (bg):', emailError?.message || emailError);
        }
      });
      
      setCooldown(cooldowns.resend, normalizedEmail);
      
      return res.status(200).json({
        message: 'Verification code sent successfully!',
        ...((!isProd || process.env.OTP_DEBUG === 'true') ? { debugOtp: otp } : {})
      });
      
    } catch (emailError) {
      console.error('Failed to prepare verification email:', emailError);
      setCooldown(cooldowns.resend, normalizedEmail);
      
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Server error' });
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

    // Check if email verification is required and user is not verified
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireEmailVerification && !user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email address before logging in',
        requiresVerification: true,
        email: user.email
      });
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
router.get('/verify-link', async (req, res) => {
  try {
    const { token, next = '/', welcome } = req.query;
    
    if (!token) {
      return res.status(400).send('Invalid verification link');
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    if (user.isEmailVerified) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}${next}?verified=already`);
    }
    
    // Verify the user
    user.isEmailVerified = true;
    await user.save();
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}${next}?verified=success${welcome ? '&welcome=1' : ''}`;
    
    return res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Email verification link error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?verified=error`);
  }
});

// Forgot Password: Request OTP
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = String(email).toLowerCase();

    // Cooldown per email
    if (isCoolingDown(cooldowns.forgot, normalizedEmail)) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    
    // Always respond with success to prevent email enumeration
    setCooldown(cooldowns.forgot, normalizedEmail);
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.' 
      });
    }

    try {
      // Generate 6-digit OTP and store hash in resetPasswordToken
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      
      user.resetPasswordToken = otpHash;
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Send OTP email in background to avoid blocking response
      setImmediate(async () => {
        try {
          const emailResult = await sendOTPEmail(normalizedEmail, otp, 'password-reset');
          console.log('📧 Password reset OTP sent (bg):', emailResult);
        } catch (emailError) {
          console.error('Failed to send password reset email (bg):', emailError?.message || emailError);
        }
      });

      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.',
        ...((!isProd || process.env.OTP_DEBUG === 'true') ? { debugOtp: otp } : {})
      });
      
    } catch (emailError) {
      console.error('Failed to prepare password reset email:', emailError);
      
      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.',
        // Don't reveal email sending failures to prevent enumeration
      });
    }
    
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