/**
 * Admin Statistics and Analytics Controller
 * 
 * Provides platform-wide statistics, analytics, and activity monitoring
 * for administrative dashboard and reporting.
 */

const db = require('../../database');
const logger = require('../../utils/logger');

/**
 * Get platform-wide statistics
 */
async function getStats(req, res) {
  try {
    // Get user counts by subscription tier
    const userStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN subscription_tier = 'free' THEN 1 END) as free_users,
        COUNT(CASE WHEN subscription_tier = 'pro' THEN 1 END) as pro_users,
        COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END) as premium_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);
    
    // Get follow statistics
    const followStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_follows,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_follows,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_follows,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_follows,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as follows_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as follows_7d
      FROM follows
    `);
    
    // Get revenue metrics (simplified)
    const revenueResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN subscription_tier = 'pro' THEN 1 END) * 10 as pro_revenue,
        COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END) * 20 as premium_revenue
      FROM users 
      WHERE status = 'active'
    `);
    
    const stats = {
      users: userStatsResult.rows[0],
      follows: followStatsResult.rows[0],
      revenue: {
        monthly_recurring: 
          parseFloat(revenueResult.rows[0].pro_revenue || 0) + 
          parseFloat(revenueResult.rows[0].premium_revenue || 0),
        pro: parseFloat(revenueResult.rows[0].pro_revenue || 0),
        premium: parseFloat(revenueResult.rows[0].premium_revenue || 0)
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}

/**
 * Get platform analytics with time-based aggregation
 */
async function getAnalytics(req, res) {
  try {
    const { period = '7d' } = req.query;
    
    // Parse period to get date range
    const periodDays = parseInt(period) || 7;
    
    // Get user growth
    const userGrowthResult = await db.query(
      `SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${periodDays} days'
      GROUP BY date
      ORDER BY date DESC`
    );
    
    // Get follow activity
    const followActivityResult = await db.query(
      `SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as follows,
        COUNT(DISTINCT user_id) as unique_users
      FROM follow_tasks
      WHERE created_at >= NOW() - INTERVAL '${periodDays} days'
      GROUP BY date
      ORDER BY date DESC`
    );
    
    res.json({
      success: true,
      data: {
        period: `${periodDays}d`,
        userGrowth: userGrowthResult.rows,
        followActivity: followActivityResult.rows
      }
    });
  } catch (error) {
    logger.error('Admin analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
}

/**
 * Get recent system activity
 */
async function getActivity(req, res) {
  try {
    const { limit = 50 } = req.query;
    
    // Get recent follow tasks
    const recentFollowsResult = await db.query(
      `SELECT 
        ft.*, 
        u.display_name, 
        u.email
      FROM follow_tasks ft
      JOIN users u ON ft.user_id = u.id
      ORDER BY ft.created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );
    
    // Get recent user registrations
    const recentUsersResult = await db.query(
      `SELECT id, display_name, email, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: {
        recentFollows: recentFollowsResult.rows,
        recentUsers: recentUsersResult.rows
      }
    });
  } catch (error) {
    logger.error('Admin activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch activity',
      message: error.message
    });
  }
}

module.exports = {
  getStats,
  getAnalytics,
  getActivity
};