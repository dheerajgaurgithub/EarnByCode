import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to check if user is blocked and unblock if expired
const isUserBlocked = async (user) => {
  // If user is not blocked, return false immediately
  if (!user.isBlocked) return false;
  
  // If there's no blockUntil date, consider user as blocked
  if (!user.blockedUntil) return true;
  
  const now = new Date();
  const blockUntil = new Date(user.blockedUntil);
  
  // If block has expired, unblock the user
  if (blockUntil <= now) {
    try {
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
      return false;
    } catch (error) {
      console.error('Error auto-unblocking user:', error);
      return true; // If there's an error, keep the user blocked for security
    }
  }
  
  // If we get here, the user is still blocked
  return true;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    // Check if user is blocked
    const isBlocked = await isUserBlocked(user);
    if (isBlocked) {
      let blockMessage = 'Your account has been blocked.';
      
      if (user.blockedUntil) {
        blockMessage = `Your account has been blocked until ${new Date(user.blockedUntil).toLocaleString()}.`;
      }
      
      if (user.blockReason) {
        blockMessage += ` Reason: ${user.blockReason}`;
      }
      
      // If the block was just expired and cleared, we'll have isBlocked as false
      if (!user.isBlocked) {
        // Refresh the user data
        const updatedUser = await User.findById(user._id).select('-password');
        if (updatedUser) {
          req.user = updatedUser;
          return next();
        }
      }
      
      return res.status(403).json({ 
        message: blockMessage,
        blockedUntil: user.blockedUntil,
        blockReason: user.blockReason,
        isBlocked: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // Block admin from participating in any user activities
    const disallowedPaths = [
      '/api/submit',
      '/api/contests/join',
      '/api/contests/submit',
      '/api/leaderboard'
    ];
    
    if (disallowedPaths.some(path => req.path.startsWith(path))) {
      return res.status(403).json({ 
        message: 'Admin accounts are restricted from participating in platform activities.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default authenticate;