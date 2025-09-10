import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateRandomPassword } from '../config/auth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const state = req.query.redirectTo || '/';
  const authenticator = passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state // Pass the redirect path as state
  });
  authenticator(req, res, next);
});

// Custom error handler for OAuth failures
const handleOAuthError = (req, res, error) => {
  console.error('OAuth Error:', error);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
  return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
};

// Handle OAuth success with token and redirect
const handleOAuthSuccess = (req, res, user, redirectPath = '/') => {
  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}${redirectPath}`;

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  });

  // For API clients, return JSON with token
  if (req.accepts('json')) {
    return res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      },
      redirectUrl
    });
  }

  // For browser redirects
  return res.redirect(redirectUrl);
};

router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: '/login',
      failureMessage: true 
    }, (err, user, info) => {
      if (err) return handleOAuthError(req, res, err);
      if (!user) {
        const error = new Error(info?.message || 'Authentication failed');
        return handleOAuthError(req, res, error);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const redirectPath = req.query.state || '/';
      return handleOAuthSuccess(req, res, req.user, redirectPath);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return handleOAuthError(req, res, error);
    }
  }
);

export default router;
