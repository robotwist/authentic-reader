const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware that verifies the JWT token
 * and attaches the user to the request object
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    console.log('Verifying token...');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Token decoded:', decoded);
    
    // Use decoded.id (new format) or decoded.userId (old format)
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.error('No user ID in token payload');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    console.log('Looking up user with ID:', userId);
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.id, user.username);
    
    // Attach the user object to the request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

/**
 * Optional authentication - attaches user to request if token is present
 * but doesn't fail if no token is provided
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, proceed without user
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Use decoded.id (new format) or decoded.userId (old format)
    const userId = decoded.id || decoded.userId;
    
    if (userId) {
      // Find the user
      const user = await User.findByPk(userId);
      
      if (user) {
        // Attach the user object to the request
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Any error means we proceed without user
    next();
  }
};

// Admin middleware - requires user to be an admin
const adminRequired = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  adminRequired
}; 