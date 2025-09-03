/**
 * Admin Authentication Middleware
 * 
 * Verifies that authenticated users have admin privileges
 * before allowing access to administrative endpoints.
 */

const db = require('../database');
const logger = require('../utils/logger');

/**
 * Middleware to check admin privileges
 */
async function requireAdmin(req, res, next) {
  try {
    // Fetch user from database using authenticated user ID
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user?.id || req.session?.userId]
    );
    
    const user = result.rows[0];
    
    // Check if user has admin role by verifying email against admin list
    // In production, this should check a role field in the database
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@followswarm.com'];
    
    if (!user || !adminEmails.includes(user.email)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'Failed to verify admin status'
    });
  }
}

module.exports = {
  requireAdmin
};