const session = require('express-session');
const connectRedis = require('connect-redis');
const { createClient } = require('redis');
const config = require('../../config');
const logger = require('../utils/logger');

// Initialize connect-redis
const RedisStore = connectRedis(session);

// Create Redis client for sessions
const redisClient = createClient({
  url: config.redis.url,
  legacyMode: true
});

redisClient.connect().catch(console.error);

redisClient.on('error', (err) => {
  logger.error('Redis session client error:', err);
});

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