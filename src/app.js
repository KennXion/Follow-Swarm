/**
 * Express Application Setup
 * 
 * Exports the configured Express app without starting the server.
 * This allows for better testing and separation of concerns.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('../config');
const logger = require('./utils/logger');
const sessionMiddleware = require('./middleware/session');

// Create Express application instance
const app = express();

// Trust proxy headers (for deployment behind reverse proxy)
app.set('trust proxy', 1);

/**
 * Security Middleware Configuration
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.spotify.com", "https://api.spotify.com"]
    }
  }
}));

/**
 * CORS Configuration
 */
app.use(cors({
  origin: config.server.env === 'production' 
    ? config.server.corsOrigin 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response compression
app.use(compression());

// HTTP request logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { 
    stream: { 
      write: message => logger.http(message.trim()) 
    }
  }));
}

// Session management
app.use(sessionMiddleware);

/**
 * Global Rate Limiting
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', globalRateLimiter);

/**
 * Health Check Endpoint
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(health);
});

/**
 * API Routes
 * Only mount routes if not in a pure mock test environment
 */
if (process.env.NODE_ENV !== 'test' || !process.env.MOCK_ONLY) {
  const authRoutes = require('./api/auth.routes');
  const followRoutes = require('./api/follow.routes');
  const adminRoutes = require('./api/admin.routes');
  
  app.use('/auth', authRoutes);
  app.use('/api/follows', followRoutes);
  app.use('/api/admin', adminRoutes);
}

/**
 * Static Files (Production)
 */
if (config.server.env === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const isDevelopment = config.server.env === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

module.exports = app;