/**
 * Main Application Entry Point
 * 
 * Initializes and configures the Express server for the Follow-Swarm application.
 * Sets up middleware, routes, database connections, and handles graceful shutdown.
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
// Security and optimization middleware
const helmet = require('helmet');           // Security headers
const cors = require('cors');               // Cross-Origin Resource Sharing
const compression = require('compression'); // Gzip compression
const morgan = require('morgan');           // HTTP request logging
const rateLimit = require('express-rate-limit'); // API rate limiting

// Application modules
const config = require('../config');                    // Configuration
const logger = require('./utils/logger');               // Winston logger
const db = require('./database');                       // PostgreSQL connection
const redis = require('./database/redis');              // Redis connection
const sessionMiddleware = require('./middleware/session'); // Session management

// API Routes
const authRoutes = require('./api/auth.routes');        // Authentication endpoints
const followRoutes = require('./api/follow.routes');    // Follow operation endpoints
const queueManager = require('./services/queueManager'); // Background job processing

// Initialize Express application
const app = express();

// Trust proxy headers when behind a reverse proxy (e.g., Nginx, CloudFlare)
// Required for accurate IP addresses and HTTPS detection
app.set('trust proxy', 1);

// Security headers middleware
// Adds various HTTP headers to help protect against common vulnerabilities
app.use(helmet({
  contentSecurityPolicy: false // TODO: Configure CSP policy for production
}));

// Cross-Origin Resource Sharing configuration
// Allows frontend applications to make requests to this API
app.use(cors({
  origin: config.server.env === 'production' 
    ? ['https://spotifyswarm.com']  // Production frontend domain
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'], // Dev ports
  credentials: true // Allow cookies and auth headers
}));

// Enable Gzip compression for responses
app.use(compression());

// Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: '10mb' }));                       // JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Form submissions

// HTTP request logging through Winston
app.use(morgan('combined', { stream: logger.stream }));

// Redis-backed session management
app.use(sessionMiddleware);

// Global API rate limiting to prevent abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 100,                   // Maximum 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,      // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false        // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all API endpoints
app.use('/api/', globalLimiter);

/**
 * Health Check Endpoint
 * Used by load balancers and monitoring systems
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),           // Server uptime in seconds
    environment: config.server.env
  });
});

// Mount API route handlers
app.use('/auth', authRoutes);          // Authentication routes
app.use('/api/follows', followRoutes); // Follow operation routes

/**
 * Root Endpoint
 * Provides API information and available endpoints
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Spotify Follow-Swarm API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: {
        spotify: '/auth/spotify',      // Initiate Spotify OAuth
        callback: '/auth/callback',    // OAuth callback
        logout: '/auth/logout',        // End session
        status: '/auth/status'         // Check auth status
      },
      health: '/health'                // Health check
    }
  });
});

/**
 * 404 Not Found Handler
 * Catches all unmatched routes
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

/**
 * Global Error Handler
 * Catches and formats all unhandled errors
 */
app.use((err, req, res, next) => {
  // Log full error details
  logger.error('Unhandled error:', err);
  
  // Determine response status code
  const statusCode = err.statusCode || 500;
  // Hide error details in production for security
  const message = config.server.env === 'production' 
    ? 'An error occurred' 
    : err.message;
  
  // Send error response
  res.status(statusCode).json({
    error: 'Server Error',
    message,
    ...(config.server.env !== 'production' && { stack: err.stack }) // Include stack trace in development
  });
});

/**
 * Graceful Shutdown Handler
 * Ensures all connections are properly closed before process exit
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new HTTP connections
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close all external connections
  await db.disconnect();          // PostgreSQL
  await redis.disconnect();       // Redis
  await queueManager.shutdown();  // Bull queues
  
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

// Register shutdown handlers for different signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes/Docker stop
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C

/**
 * Server Startup Function
 * Initializes all connections and starts the HTTP server
 */
const startServer = async () => {
  try {
    // Initialize PostgreSQL connection pool
    await db.connect();
    logger.info('Database connected');
    
    // Initialize Redis connections
    redis.connect();
    logger.info('Redis connected');
    
    // Initialize Bull queues for background processing
    await queueManager.initialize();
    logger.info('Queue manager initialized');
    
    // Start HTTP server
    const port = config.server.port;
    const server = app.listen(port, () => {
      // Log startup information
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      
      // Development helper: Log OAuth URL
      if (config.server.env === 'development') {
        logger.info(`Spotify OAuth: http://localhost:${port}/auth/spotify`);
      }
    });
    
    // Store server reference globally for shutdown handler
    global.server = server;
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1); // Exit with error code
  }
};

// Initialize and start the application
startServer();

// Export app for testing
module.exports = app;