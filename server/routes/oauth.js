import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.get('/google', (req, res, next) => {
  try {
    const { redirectTo = '/', action = 'login' } = req.query;
    console.log('Initiating Google OAuth flow, redirectTo:', redirectTo, 'action:', action);
    
    // Encode the redirectTo in state
    const state = Buffer.from(JSON.stringify({ redirectTo, action })).toString('base64');
    
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
  // Try to detect desired page from state.action
  let action = 'login';
  try {
    if (req?.query?.state) {
      const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
      if (state?.action) action = String(state.action);
    }
  } catch {}
  const path = action === 'signup' ? '/register' : '/login';
  return res.redirect(`${frontendUrl}${path}?error=${errorMessage}`);
};

// Handle OAuth success with token and redirect
const handleOAuthSuccess = async (req, res, user, redirectPath = '/') => {
  try {
    console.log('Handling OAuth success for user:', user.email);
    
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';

    // If email is not verified, send verification link and do NOT log in yet
    if (!user.isEmailVerified) {
      const verifyToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const nextParam = encodeURIComponent(redirectPath || '/');
      const verifyUrl = `${config.API_URL}/api/auth/verify-link?token=${encodeURIComponent(verifyToken)}&next=${nextParam}`;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify your AlgoBucks account',
          text: `Click the link to verify your email and finish sign-in: ${verifyUrl}`,
          html: `<p>Welcome to <b>AlgoBucks</b>!</p><p>Click the button below to verify your email and finish sign-in.</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Verify Email</a></p>
                 <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                 <p><code>${verifyUrl}</code></p>`
        });
      } catch (e) {
        console.error('Failed to send Google signup verification email:', e);
      }

      // Redirect user to login page with a notice to check email for verification
      const noticeUrl = new URL('/login', frontendUrl);
      noticeUrl.searchParams.set('verify', 'sent');
      noticeUrl.searchParams.set('email', user.email);
      return res.redirect(noticeUrl.toString());
    }

    // Otherwise proceed with normal login flow
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Always redirect to frontend /auth/callback so the SPA can capture the token
    const callbackUrl = new URL('/auth/callback', frontendUrl);
    const urlWithToken = new URL(callbackUrl);
    const nextParam = encodeURIComponent(redirectPath || '/');
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? new URL(frontendUrl).hostname : undefined
    });

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
