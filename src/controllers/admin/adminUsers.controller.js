/**
 * Admin User Management Controller
 * 
 * Handles all admin operations related to user management including
 * listing, updating, deleting, and suspending user accounts.
 */

const db = require('../../database');
const logger = require('../../utils/logger');
const { 
  getUsersWithFilters, 
  getUserCount, 
  updateUserFields 
} = require('./userQueries');

/**
 * Get paginated list of users with optional filters
 */
async function getUsers(req, res) {
  try {
    const { page = 1, limit = 50, search, status, tier } = req.query;
    const offset = (page - 1) * limit;
    
    // Get filtered users
    const result = await getUsersWithFilters(
      { search, status, tier },
      { limit, offset }
    );
    
    // Get total count for pagination
    const totalCount = await getUserCount({ search, status, tier });
    
    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
}

/**
 * Get detailed user information
 */
async function getUserById(req, res) {
  try {
    const userResult = await db.query(
      `SELECT 
        id, spotify_id, display_name, email, followers, 
        subscription_tier, subscription_plan, subscription_status,
        status, is_verified, is_active, total_follows,
        created_at, updated_at, last_login_at
      FROM users 
      WHERE id = $1`,
      [req.params.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    const user = userResult.rows[0];
    
    // Get user's recent follow activity
    const followsResult = await db.query(
      `SELECT COUNT(*) as total_follows
      FROM follows 
      WHERE follower_user_id = $1`,
      [req.params.userId]
    );
    
    user.followStats = {
      total: parseInt(followsResult.rows[0]?.total_follows || 0)
    };
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Admin get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
}

/**
 * Update user details
 */
async function updateUser(req, res) {
  try {
    const { status, subscriptionPlan, isVerified } = req.body;
    
    // Check if user exists
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Execute update using helper
    const updateResult = await updateUserFields(
      req.params.userId,
      { status, subscriptionPlan, isVerified }
    );
    
    if (!updateResult) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updateResult.rows[0] }
    });
  } catch (error) {
    logger.error('Admin update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
}

/**
 * Delete a user account
 */
async function deleteUser(req, res) {
  try {
    // Check if trying to delete self
    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'Administrators cannot delete their own account'
      });
    }
    
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Soft delete by setting status to 'deleted'
    await db.query(
      "UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [req.params.userId]
    );
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Admin user delete error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
}

/**
 * Suspend or unsuspend a user
 */
async function suspendUser(req, res) {
  try {
    const { reason, duration } = req.body;
    
    // Calculate suspension end date
    const suspensionEnds = duration 
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;
    
    await db.query(
      `UPDATE users 
       SET status = 'suspended', 
           suspension_reason = $1,
           suspension_ends_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [reason, suspensionEnds, req.params.userId]
    );
    
    logger.info('User suspended:', {
      userId: req.params.userId,
      adminId: req.user.id,
      reason,
      duration
    });
    
    res.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        userId: req.params.userId,
        suspensionEnds
      }
    });
  } catch (error) {
    logger.error('Admin suspend user error:', error);
    res.status(500).json({
      error: 'Failed to suspend user',
      message: error.message
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  suspendUser
};