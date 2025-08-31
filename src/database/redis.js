/**
 * Redis Client Module
 * 
 * This module provides a comprehensive Redis client wrapper for the Follow-Swarm application.
 * It handles caching, session management, rate limiting, distributed locking, and pub/sub messaging.
 * All Redis operations are centralized here for consistency and maintainability.
 */

const Redis = require('ioredis');
const config = require('../../config');
const logger = require('../utils/logger');

/**
 * RedisClient Class
 * 
 * Manages multiple Redis connections for different purposes:
 * - Main client: General operations (caching, sessions, rate limiting)
 * - Subscriber: Pub/Sub message reception
 * - Publisher: Pub/Sub message broadcasting
 */
class RedisClient {
  constructor() {
    // Main Redis client for general operations
    this.client = null;
    // Dedicated client for subscribing to pub/sub channels
    this.subscriber = null;
    // Dedicated client for publishing to pub/sub channels
    this.publisher = null;
  }

  /**
   * Establishes connections to Redis server
   * Creates three separate connections for different purposes to avoid blocking
   * @returns {Redis} The main Redis client instance
   */
  connect() {
    // Configuration object for Redis connections
    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: config.redis.retryStrategy,
      maxRetriesPerRequest: 3, // Maximum retry attempts for failed requests
      enableReadyCheck: true, // Wait for Redis to be ready before sending commands
      enableOfflineQueue: true // Queue commands when offline, execute when reconnected
    };

    // Main client for general operations
    this.client = new Redis(redisConfig);
    
    // Separate clients for pub/sub
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    // Error handling
    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    if (this.publisher) {
      await this.publisher.quit();
    }
    logger.info('Redis disconnected');
  }

  /**
   * Session Management Methods
   * Handles user session storage and retrieval
   */

  /**
   * Stores user session data in Redis
   * @param {string} sessionId - Unique session identifier
   * @param {Object} userData - User data to store in session
   * @param {number} ttl - Time to live in seconds (default: 24 hours)
   */
  async setSession(sessionId, userData, ttl = 86400) {
    const key = `session:${sessionId}`;
    await this.client.setex(key, ttl, JSON.stringify(userData));
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  /**
   * Rate Limiting Methods
   * Implements sliding window rate limiting for API and follow actions
   */

  /**
   * Increments rate limit counter for a user action
   * Uses sliding window approach with automatic expiration
   * @param {string} userId - User identifier
   * @param {string} action - Action being rate limited (e.g., 'follow', 'api_call')
   * @param {string} window - Time window: 'hour', 'day', or 'month'
   * @returns {number} Current count for the time window
   */
  async incrementRateLimit(userId, action, window = 'hour') {
    const now = Date.now();
    // Convert window to milliseconds: hour=3600000ms, day=86400000ms, month=2592000000ms
    const windowMs = window === 'hour' ? 3600000 : window === 'day' ? 86400000 : 2592000000;
    // Calculate window start time (aligned to window boundaries)
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `rate:${userId}:${action}:${window}:${windowStart}`;
    
    const count = await this.client.incr(key);
    
    // Set expiration only on first increment to avoid extending TTL
    if (count === 1) {
      await this.client.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return count;
  }

  async getRateLimit(userId, action, window = 'hour') {
    const now = Date.now();
    const windowMs = window === 'hour' ? 3600000 : window === 'day' ? 86400000 : 2592000000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `rate:${userId}:${action}:${window}:${windowStart}`;
    
    const count = await this.client.get(key);
    return parseInt(count) || 0;
  }

  async checkRateLimit(userId, action, limit, window = 'hour') {
    const count = await this.getRateLimit(userId, action, window);
    return count < limit;
  }

  /**
   * Token Caching Methods
   * Caches OAuth tokens for quick access without database queries
   */

  /**
   * Caches OAuth token data in Redis
   * @param {string} userId - User identifier
   * @param {Object} tokenData - Token information to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  async cacheToken(userId, tokenData, ttl = 3600) {
    const key = `token:${userId}`;
    await this.client.setex(key, ttl, JSON.stringify(tokenData));
  }

  async getCachedToken(userId) {
    const key = `token:${userId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateToken(userId) {
    const key = `token:${userId}`;
    await this.client.del(key);
  }

  /**
   * User Data Caching Methods
   * Reduces database load by caching frequently accessed user data
   */

  /**
   * Caches user profile data in Redis
   * @param {string} userId - User identifier
   * @param {Object} userData - User profile data to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  async cacheUser(userId, userData, ttl = 3600) {
    const key = `user:${userId}`;
    await this.client.setex(key, ttl, JSON.stringify(userData));
  }

  async getCachedUser(userId) {
    const key = `user:${userId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Queue Metrics Methods
   * Tracks and monitors queue performance and health
   */

  /**
   * Updates queue performance metrics
   * @param {string} queueName - Name of the queue
   * @param {Object} metrics - Metrics object with queue statistics
   */
  async updateQueueMetrics(queueName, metrics) {
    const key = `metrics:queue:${queueName}`;
    await this.client.hmset(key, metrics);
    await this.client.expire(key, 300); // Expire after 5 minutes for fresh metrics
  }

  async getQueueMetrics(queueName) {
    const key = `metrics:queue:${queueName}`;
    return await this.client.hgetall(key);
  }

  /**
   * Follow Progress Tracking
   * Monitors user's follow operation progress and statistics
   */

  /**
   * Updates follow operation progress for a user
   * @param {string} userId - User identifier
   * @param {Object} progress - Progress data (completed, pending, failed counts)
   */
  async updateFollowProgress(userId, progress) {
    const key = `progress:${userId}`;
    await this.client.hmset(key, progress);
    await this.client.expire(key, 86400); // Keep progress data for 24 hours
  }

  async getFollowProgress(userId) {
    const key = `progress:${userId}`;
    return await this.client.hgetall(key);
  }

  /**
   * Distributed Locking Methods
   * Implements Redis-based distributed locks to prevent race conditions
   * and duplicate processing in distributed environments
   */

  /**
   * Attempts to acquire a distributed lock on a resource
   * Uses SET NX (set if not exists) for atomic lock acquisition
   * @param {string} resource - Resource identifier to lock
   * @param {number} ttl - Lock timeout in milliseconds (default: 10 seconds)
   * @returns {string|null} Lock token if acquired, null if resource is already locked
   */
  async acquireLock(resource, ttl = 10000) {
    const key = `lock:${resource}`;
    // Generate unique token for lock ownership verification
    const token = Math.random().toString(36).substring(2);
    
    // Atomic lock acquisition: SET with PX (expire in ms) and NX (only if not exists)
    const result = await this.client.set(key, token, 'PX', ttl, 'NX');
    
    if (result === 'OK') {
      return token;
    }
    return null;
  }

  /**
   * Releases a distributed lock
   * Uses Lua script for atomic check-and-delete to prevent releasing others' locks
   * @param {string} resource - Resource identifier
   * @param {string} token - Lock token obtained during acquisition
   * @returns {number} 1 if lock was released, 0 if token didn't match
   */
  async releaseLock(resource, token) {
    const key = `lock:${resource}`;
    // Lua script ensures atomic operation: only delete if token matches
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    return await this.client.eval(script, 1, key, token);
  }

  /**
   * Analytics and Event Tracking
   * Stores user events for analytics and monitoring
   */

  /**
   * Tracks user events for analytics
   * Events are stored in daily lists for efficient retrieval
   * @param {string} userId - User identifier
   * @param {string} eventType - Type of event (e.g., 'follow', 'login', 'error')
   * @param {Object} eventData - Additional event metadata
   */
  async trackEvent(userId, eventType, eventData) {
    const key = `events:${eventType}:${new Date().toISOString().slice(0, 10)}`;
    const data = JSON.stringify({ userId, ...eventData, timestamp: Date.now() });
    await this.client.lpush(key, data);
    await this.client.expire(key, 604800); // Retain events for 7 days for analytics
  }

  async getEvents(eventType, date) {
    const key = `events:${eventType}:${date}`;
    const events = await this.client.lrange(key, 0, -1);
    return events.map(e => JSON.parse(e));
  }

  /**
   * Pub/Sub Messaging Methods
   * Enables real-time communication between different parts of the application
   */

  /**
   * Publishes a message to a Redis channel
   * @param {string} channel - Channel name to publish to
   * @param {Object} message - Message object to broadcast
   */
  async publish(channel, message) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribes to a Redis channel for receiving messages
   * @param {string} channel - Channel name to subscribe to
   * @param {Function} callback - Function to call when message is received
   */
  async subscribe(channel, callback) {
    await this.subscriber.subscribe(channel);
    // Set up message handler for this channel
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  async unsubscribe(channel) {
    await this.subscriber.unsubscribe(channel);
  }
}

// Export singleton instance for consistent Redis connection across application
module.exports = new RedisClient();