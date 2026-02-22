// ============================================
// Authentication Middleware – JWT Verification
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes.
 * Verifies the JWT token from the Authorization header.
 * Attaches the user object to req.user on success.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found, return 401
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID from token payload (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – token invalid'
    });
  }
};

/**
 * Middleware to restrict access to admin users only.
 * Must be used AFTER the protect middleware.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied – admin only'
    });
  }
};

module.exports = { protect, adminOnly };
