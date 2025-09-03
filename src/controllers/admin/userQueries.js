/**
 * User Query Helpers for Admin Operations
 * 
 * Reusable database queries for user management operations.
 */

const db = require('../../database');

/**
 * Build filtered user query with pagination
 */
async function getUsersWithFilters(filters, pagination) {
  const { search, status, tier } = filters;
  const { limit, offset } = pagination;
  
  // Build query with filters
  let query = `
    SELECT 
      id, spotify_id, display_name, email, 
      subscription_tier, subscription_plan, 
      status, is_verified, is_active,
      total_follows, followers,
      created_at, updated_at, last_login_at
    FROM users
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramCount = 0;
  
  if (search) {
    paramCount++;
    query += ` AND (display_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
    queryParams.push(`%${search}%`);
  }
  
  if (status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    queryParams.push(status);
  }
  
  if (tier) {
    paramCount++;
    query += ` AND subscription_tier = $${paramCount}`;
    queryParams.push(tier);
  }
  
  // Add ordering and pagination
  paramCount++;
  query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
  queryParams.push(parseInt(limit));
  
  paramCount++;
  query += ` OFFSET $${paramCount}`;
  queryParams.push(parseInt(offset));
  
  return db.query(query, queryParams);
}

/**
 * Get total count of users with filters
 */
async function getUserCount(filters) {
  const { search, status, tier } = filters;
  
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const countParams = [];
  let paramCount = 0;
  
  if (search) {
    paramCount++;
    countQuery += ` AND (display_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
    countParams.push(`%${search}%`);
  }
  
  if (status) {
    paramCount++;
    countQuery += ` AND status = $${paramCount}`;
    countParams.push(status);
  }
  
  if (tier) {
    paramCount++;
    countQuery += ` AND subscription_tier = $${paramCount}`;
    countParams.push(tier);
  }
  
  const result = await db.query(countQuery, countParams);
  return parseInt(result.rows[0].total);
}

/**
 * Build and execute user update query
 */
async function updateUserFields(userId, updates) {
  const { status, subscriptionPlan, isVerified } = updates;
  
  let updateFields = [];
  let queryParams = [];
  let paramCount = 0;
  
  if (status !== undefined) {
    paramCount++;
    updateFields.push(`status = $${paramCount}`);
    queryParams.push(status);
  }
  
  if (subscriptionPlan !== undefined) {
    paramCount++;
    updateFields.push(`subscription_plan = $${paramCount}`);
    queryParams.push(subscriptionPlan);
  }
  
  if (isVerified !== undefined) {
    paramCount++;
    updateFields.push(`is_verified = $${paramCount}`);
    queryParams.push(isVerified);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  // Add user ID to params
  paramCount++;
  queryParams.push(userId);
  
  return db.query(
    `UPDATE users 
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount}
     RETURNING *`,
    queryParams
  );
}

module.exports = {
  getUsersWithFilters,
  getUserCount,
  updateUserFields
};