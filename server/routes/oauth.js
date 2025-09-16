import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateRandomPassword } from '../config/auth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  try {
    const { redirectTo = '/' } = req.query;
    console.log('Initiating Google OAuth flow, redirectTo:', redirectTo);
    
    // Encode the redirectTo in state
    const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64');
    
    const authenticator = passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
      prompt: 'select_account',
      accessType: 'offline'
    });
    
    authenticator(req, res, next);
  } catch (error) {
    console.error('Error in Google OAuth init:', error);
    next(error);
  }
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
    try {
      console.log('Google OAuth callback received. Query:', req.query);
      
      // Parse the state parameter
      let redirectTo = '/';
      if (req.query.state) {
        try {
          const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          if (state.redirectTo) {
            redirectTo = state.redirectTo;
            console.log('Extracted redirectTo from state:', redirectTo);
          }
        } catch (e) {
          console.error('Error parsing state:', e);
        }
      }
      
      passport.authenticate('google', { 
        session: false,
        failureRedirect: '/login',
        failureMessage: true,
        state: req.query.state // Pass through the state
      }, (err, user, info) => {
        if (err) {
          console.error('Passport auth error:', err);
          return handleOAuthError(req, res, err);
        }
        if (!user) {
          const error = new Error(info?.message || 'Authentication failed');
          console.error('Authentication failed:', info);
          return handleOAuthError(req, res, error);
        }
        req.user = user;
        req.redirectTo = redirectTo;
        next();
      })(req, res, next);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      return handleOAuthError(req, res, error);
    }
  },
  async (req, res) => {
    try {
      console.log('OAuth successful for user:', req.user.email);
      return handleOAuthSuccess(req, res, req.user, req.redirectTo || '/');
    } catch (error) {
      console.error('Error in OAuth success handler:', error);
      return handleOAuthError(req, res, error);
    }
  }
);

export default router;
