const Redis = require('ioredis');
const config = require('../../config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
  }

  connect() {
    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: config.redis.retryStrategy,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true
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

  // Session management
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

  // Rate limiting
  async incrementRateLimit(userId, action, window = 'hour') {
    const now = Date.now();
    const windowMs = window === 'hour' ? 3600000 : window === 'day' ? 86400000 : 2592000000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `rate:${userId}:${action}:${window}:${windowStart}`;
    
    const count = await this.client.incr(key);
    
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

  // Token caching
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

  // User data caching
  async cacheUser(userId, userData, ttl = 3600) {
    const key = `user:${userId}`;
    await this.client.setex(key, ttl, JSON.stringify(userData));
  }

  async getCachedUser(userId) {
    const key = `user:${userId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Queue metrics
  async updateQueueMetrics(queueName, metrics) {
    const key = `metrics:queue:${queueName}`;
    await this.client.hmset(key, metrics);
    await this.client.expire(key, 300); // 5 minutes
  }

  async getQueueMetrics(queueName) {
    const key = `metrics:queue:${queueName}`;
    return await this.client.hgetall(key);
  }

  // Follow progress tracking
  async updateFollowProgress(userId, progress) {
    const key = `progress:${userId}`;
    await this.client.hmset(key, progress);
    await this.client.expire(key, 86400); // 24 hours
  }

  async getFollowProgress(userId) {
    const key = `progress:${userId}`;
    return await this.client.hgetall(key);
  }

  // Distributed locking (for preventing duplicate processing)
  async acquireLock(resource, ttl = 10000) {
    const key = `lock:${resource}`;
    const token = Math.random().toString(36).substring(2);
    
    const result = await this.client.set(key, token, 'PX', ttl, 'NX');
    
    if (result === 'OK') {
      return token;
    }
    return null;
  }

  async releaseLock(resource, token) {
    const key = `lock:${resource}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    return await this.client.eval(script, 1, key, token);
  }

  // Analytics tracking
  async trackEvent(userId, eventType, eventData) {
    const key = `events:${eventType}:${new Date().toISOString().slice(0, 10)}`;
    const data = JSON.stringify({ userId, ...eventData, timestamp: Date.now() });
    await this.client.lpush(key, data);
    await this.client.expire(key, 604800); // 7 days
  }

  async getEvents(eventType, date) {
    const key = `events:${eventType}:${date}`;
    const events = await this.client.lrange(key, 0, -1);
    return events.map(e => JSON.parse(e));
  }

  // Pub/Sub methods
  async publish(channel, message) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel, callback) {
    await this.subscriber.subscribe(channel);
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

module.exports = new RedisClient();