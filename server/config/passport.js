import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { generateRandomPassword, generateUniqueUsername } from './auth.js';
import config from './config.js';

const configurePassport = (passport) => {
  // Google OAuth Strategy
  const callbackURL = `${config.API_URL}/api/oauth/google/callback`;
  console.log('[OAuth] Using Google Client ID:', config.GOOGLE_CLIENT_ID);
  console.log('[OAuth] Using Callback URL:', callbackURL);

  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL,
    passReqToCallback: true,
    scope: ['profile', 'email']
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Extract action from OAuth state if present (default to 'login')
      let action = 'login';
      try {
        if (req?.query?.state) {
          const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          if (state?.action) action = String(state.action);
        }
      } catch {}

      // Check if user already exists by Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // If we have a Google photo and user has no avatar set, update it
        const googlePhoto = Array.isArray(profile.photos) && profile.photos[0]?.value ? profile.photos[0].value : '';
        if (!user.avatarUrl && googlePhoto) {
          try {
            user.avatarUrl = googlePhoto;
            await user.save();
          } catch {}
        }
        // Existing account, not a new user
        try { req.oauthNewUser = false; } catch {}
        return done(null, user);
      }

      // Check if user exists by email but not linked to Google
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.googleProfile = profile._json;
        if (!user.isEmailVerified) user.isEmailVerified = true;
        // Populate avatar if missing from Google profile
        const googlePhoto = Array.isArray(profile.photos) && profile.photos[0]?.value ? profile.photos[0].value : '';
        if (!user.avatarUrl && googlePhoto) {
          user.avatarUrl = googlePhoto;
        }
        await user.save();
        try { req.oauthNewUser = false; } catch {}
        return done(null, user);
      }

      // If we're in 'login' action and user does not exist, do NOT auto-create
      if (action === 'login') {
        return done(null, false, { message: 'No account found for this Google email. Please sign up with Google first.' });
      }

      // Create new user (signup flow)
      const username = await generateUniqueUsername(profile.emails[0].value.split('@')[0]);
      const password = generateRandomPassword();
      
      const googlePhoto = Array.isArray(profile.photos) && profile.photos[0]?.value ? profile.photos[0].value : '';
      user = new User({
        username,
        email: profile.emails[0].value,
        password,
        fullName: profile.displayName || profile.emails[0].value.split('@')[0],
        googleId: profile.id,
        googleProfile: profile._json,
        isEmailVerified: true,
        avatarUrl: googlePhoto || ''
      });

      await user.save();
      // Mark as newly created user for downstream logic (e.g., welcome email)
      try { req.oauthNewUser = true; } catch {}
      done(null, user);
    } catch (error) {
      console.error('Passport Google Strategy Error:', error);
      done(error, null);
    }
  }));

  // Serialize user into the sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the sessions
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

// Configure passport
configurePassport(passport);

export default passport;
