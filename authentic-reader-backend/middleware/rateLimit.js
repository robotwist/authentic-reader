import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Rate Limiting Middleware
 * 
 * Implements different rate limiting strategies for various endpoints:
 * - Strict limits for authentication endpoints
 * - Moderate limits for API endpoints
 * - Generous limits for public endpoints
 */

// Authentication rate limiter (strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth endpoint: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes',
      retryAfter: Math.ceil(15 * 60 / 1000) // seconds
    });
  }
});

// API rate limiter (moderate)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many API requests',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for API endpoint: ${req.ip} - ${req.path}`);
    res.status(429).json({
      error: 'Too many API requests',
      message: 'Please try again in 15 minutes',
      retryAfter: Math.ceil(15 * 60 / 1000)
    });
  }
});

// Analysis rate limiter (for AI/ML endpoints)
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 analysis requests per hour
  message: {
    error: 'Analysis rate limit exceeded',
    message: 'Please try again in 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Analysis rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json({
      error: 'Analysis rate limit exceeded',
      message: 'Please try again in 1 hour',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Public endpoints rate limiter (generous)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Public rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again in 15 minutes',
      retryAfter: Math.ceil(15 * 60 / 1000)
    });
  }
});

// Admin endpoints rate limiter (very strict)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Admin rate limit exceeded',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Admin rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json({
      error: 'Admin rate limit exceeded',
      message: 'Please try again in 15 minutes',
      retryAfter: Math.ceil(15 * 60 / 1000)
    });
  }
});

// Dynamic rate limiter based on user role
export const dynamicLimiter = (req, res, next) => {
  // Apply different limits based on user role
  if (req.user?.isAdmin) {
    return adminLimiter(req, res, next);
  } else if (req.user) {
    return apiLimiter(req, res, next);
  } else {
    return publicLimiter(req, res, next);
  }
};

export default {
  authLimiter,
  apiLimiter,
  analysisLimiter,
  publicLimiter,
  adminLimiter,
  dynamicLimiter
};
