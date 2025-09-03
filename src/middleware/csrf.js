/**
 * CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection using double-submit cookie pattern
 * with csrf-csrf library for enhanced security.
 */

const { doubleCsrf } = require('csrf-csrf');
const config = require('../../config');
const logger = require('../utils/logger');

// Configure CSRF protection
const csrfOptions = {
  getSecret: () => config.security.sessionSecret,
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: config.server.env === 'production',
    httpOnly: true,
    path: '/',
  },
  getTokenFromRequest: (req) => {
    // Try to get token from multiple sources
    return req.headers['x-csrf-token'] || 
           req.body._csrf || 
           req.query._csrf;
  },
};

// Create CSRF protection middleware
const { 
  generateToken, 
  validateRequest, 
  doubleCsrfProtection 
} = doubleCsrf(csrfOptions);

/**
 * Middleware to generate and attach CSRF token to response
 */
const attachCsrfToken = (req, res, next) => {
  try {
    // generateToken is a method that needs req and res
    const csrfToken = generateToken(res, req);
    
    // Make token available in multiple ways
    res.locals.csrfToken = csrfToken;
    
    // Add token to response header for API calls
    res.setHeader('X-CSRF-Token', csrfToken);
    
    next();
  } catch (error) {
    logger.error('Failed to generate CSRF token:', error);
    next(error);
  }
};

/**
 * Middleware to validate CSRF token on state-changing requests
 */
const validateCsrfToken = (req, res, next) => {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip for OAuth callbacks (they won't have our CSRF token)
  if (req.path === '/auth/callback') {
    return next();
  }
  
  // Skip for health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  try {
    validateRequest(req);
    next();
  } catch (error) {
    logger.warn('CSRF validation failed:', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Your request could not be validated. Please refresh and try again.'
    });
  }
};

/**
 * Endpoint to get a fresh CSRF token
 */
const getCsrfToken = (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
};

module.exports = {
  attachCsrfToken,
  validateCsrfToken,
  doubleCsrfProtection,
  getCsrfToken
};