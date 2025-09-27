import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

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
  const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';
  const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
  return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
};

// Handle OAuth success with token and redirect
const handleOAuthSuccess = async (req, res, user, redirectPath = '/') => {
  try {
    console.log('Handling OAuth success for user:', user.email);
    
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

    const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';
    // Always redirect to frontend /auth/callback so the SPA can capture the token
    const callbackUrl = new URL('/auth/callback', frontendUrl);
    // Place token and optional next path in the URL hash for the SPA to parse
    const urlWithToken = new URL(callbackUrl);
    const nextParam = encodeURIComponent(redirectPath || '/');
    // Include welcome=1 for newly created users so UI can show success message
    const welcomeFlag = req.oauthNewUser ? '&welcome=1' : '';
    urlWithToken.hash = `#token=${token}&next=${nextParam}${welcomeFlag}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified
    }))}`;

    // Set HTTP-only cookie for API requests
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? new URL(frontendUrl).hostname : undefined
    });

    console.log('Redirecting to:', urlWithToken.toString());

    // Best-effort: if user just registered via Google, send a welcome/verification email with the same login link
    if (req.oauthNewUser && user?.email) {
      try {
        const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';
        const prettyLink = new URL('/auth/callback', frontendUrl);
        prettyLink.hash = `#token=${token}&next=%2F&welcome=1`;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;">
            <h2>Welcome to EarnByCode, ${user.fullName || user.username || ''}!</h2>
            <p>Your Google email <b>${user.email}</b> has been verified.</p>
            <p>Click the button below to finish signing in:</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${prettyLink.toString()}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">Finish Sign-in</a>
            </p>
            <p>If the button doesn’t work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#2563EB;">${prettyLink.toString()}</p>
            <p style="color:#666;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
          </div>`;
        await sendEmail({
          to: user.email,
          subject: 'Welcome to EarnByCode — Sign-in link',
          html,
          text: `Welcome to EarnByCode! Open this link to finish signing in: ${prettyLink.toString()}`
        });
      } catch (e) {
        console.warn('Welcome email failed:', e?.message || e);
      }
    }
    
    // Redirect to frontend /auth/callback with token in URL hash
    return res.redirect(urlWithToken.toString());
  } catch (error) {
    console.error('Error in handleOAuthSuccess:', error);
    throw error;
  }
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
      return await handleOAuthSuccess(req, res, req.user, req.redirectTo || '/');
    } catch (error) {
      console.error('Error in OAuth success handler:', error);
      return handleOAuthError(req, res, error);
    }
  }
);

export default router;
