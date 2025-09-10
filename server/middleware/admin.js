// Middleware to check if user is an admin
const admin = async (req, res, next) => {
  try {
    // Check if user exists and is an admin
    if (!req.user) {
      return res.status(401).json({ msg: 'No user found. Authentication required.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export default admin;
