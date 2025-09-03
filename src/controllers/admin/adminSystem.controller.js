/**
 * Admin System Operations Controller
 * 
 * Manages system-level operations including cache management,
 * log retrieval, and security monitoring.
 */

const db = require('../../database');
const redis = require('../../database/redis');
const logger = require('../../utils/logger');

/**
 * Clear system cache
 */
async function clearCache(req, res) {
  try {
    // Clear Redis cache
    await redis.client.flushall();
    
    logger.info('Cache cleared by admin:', req.user.email);
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
}

/**
 * Get system logs
 */
async function getLogs(req, res) {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // In a real implementation, this would read from log files
    // For now, return recent database logs
    const logsResult = await db.query(
      `SELECT * FROM security_logs
      ORDER BY created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: logsResult.rows
    });
  } catch (error) {
    logger.error('Logs fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
}

/**
 * Get suspicious activity and security alerts
 */
async function getSuspiciousActivity(req, res) {
  try {
    // Get suspicious IPs
    const suspiciousIPsResult = await db.query(
      `SELECT * FROM suspicious_ips
      WHERE risk_score > 50
      ORDER BY last_checked DESC
      LIMIT 100`
    );
    
    // Get flagged users
    const flaggedUsersResult = await db.query(
      `SELECT id, display_name, email, risk_score, signup_ip, created_at
      FROM users
      WHERE flagged_for_review = true
      ORDER BY risk_score DESC
      LIMIT 100`
    );
    
    // Get recent failed login attempts
    const recentAttemptsResult = await db.query(
      `SELECT * FROM security_logs
      WHERE event_type IN ('failed_login', 'suspicious_activity')
      ORDER BY created_at DESC
      LIMIT 100`
    );
    
    res.json({
      success: true,
      data: {
        suspiciousIPs: suspiciousIPsResult.rows,
        flaggedUsers: flaggedUsersResult.rows,
        recentAttempts: recentAttemptsResult.rows
      }
    });
  } catch (error) {
    logger.error('Security fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch security data',
      message: error.message
    });
  }
}

module.exports = {
  clearCache,
  getLogs,
  getSuspiciousActivity
};