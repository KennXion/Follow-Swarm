require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('../config');
const logger = require('./utils/logger');
const db = require('./database');
const redis = require('./database/redis');
const sessionMiddleware = require('./middleware/session');

// Import routes
const authRoutes = require('./api/auth.routes');
const followRoutes = require('./api/follow.routes');
const queueManager = require('./services/queueManager');

// Create Express app
const app = express();

// Trust proxy (for production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Will configure properly for production
}));

// CORS configuration
app.use(cors({
  origin: config.server.env === 'production' 
    ? ['https://spotifyswarm.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Session middleware
app.use(sessionMiddleware);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/api/follows', followRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'Spotify Follow-Swarm API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: {
        spotify: '/auth/spotify',
        callback: '/auth/callback',
        logout: '/auth/logout',
        status: '/auth/status'
      },
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = config.server.env === 'production' 
    ? 'An error occurred' 
    : err.message;
  
  res.status(statusCode).json({
    error: 'Server Error',
    message,
    ...(config.server.env !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connections
  await db.disconnect();
  await redis.disconnect();
  await queueManager.shutdown();
  
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await db.connect();
    logger.info('Database connected');
    
    // Connect to Redis
    redis.connect();
    logger.info('Redis connected');
    
    // Initialize queue manager
    await queueManager.initialize();
    logger.info('Queue manager initialized');
    
    // Start Express server
    const port = config.server.port;
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      
      if (config.server.env === 'development') {
        logger.info(`Spotify OAuth: http://localhost:${port}/auth/spotify`);
      }
    });
    
    // Store server reference for graceful shutdown
    global.server = server;
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;