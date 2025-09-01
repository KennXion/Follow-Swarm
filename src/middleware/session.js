/**
 * Session Middleware
 * 
 * Configures Redis-backed session management for the application.
 * Provides secure, persistent sessions with automatic expiration.
 * Handles session storage, retrieval, and lifecycle management.
 */

const session = require('express-session');
const connectRedis = require('connect-redis');
const { createClient } = require('redis');
const config = require('../../config');
const logger = require('../utils/logger');

// Initialize connect-redis
const RedisStore = connectRedis(session);

// Create Redis client for sessions (skip in test environment)
let redisClient;

if (process.env.NODE_ENV !== 'test') {
  redisClient = createClient({
    url: config.redis.url,
    legacyMode: true
  });

  redisClient.connect().catch(err => logger.error('Redis connection error:', err));

  redisClient.on('error', (err) => {
    logger.error('Redis session client error:', err);
  });
} else {
  // Mock Redis client for test environment
  // Provides a minimal Redis-like interface to allow tests to run without Redis
  // The connect-redis module expects callbacks with variable argument signatures
  redisClient = {
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    quit: () => Promise.resolve(),
    on: () => {},
    get: (key, cb) => cb(null, null),
    // Handle variable arguments from connect-redis (supports both 3 and 4+ arg signatures)
    set: (key, val, ...args) => {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') {
        cb(null, 'OK');
      }
    },
    del: (key, cb) => cb(null, 1)
  };
}

// Session middleware configuration
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.server.env === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  },
  name: 'spotify_swarm_sid'
});

module.exports = sessionMiddleware;