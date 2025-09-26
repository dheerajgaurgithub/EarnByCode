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
      // Check if user already exists by Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists by email but not linked to Google
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.googleProfile = profile._json;
        if (!user.isEmailVerified) user.isEmailVerified = true;
        await user.save();
        return done(null, user);
      }

      // Create new user
      const username = await generateUniqueUsername(profile.emails[0].value.split('@')[0]);
      const password = generateRandomPassword();
      
      user = new User({
        username,
        email: profile.emails[0].value,
        password,
        fullName: profile.displayName || profile.emails[0].value.split('@')[0],
        googleId: profile.id,
        googleProfile: profile._json,
        isEmailVerified: true
      });

      await user.save();
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
