/**
 * Main Application Entry Point
 * 
 * Initializes and configures the Express server for the Follow-Swarm application.
 * Sets up middleware, routes, database connections, and handles graceful shutdown.
 */

// Load environment variables from .env file
require('dotenv').config();

// Validate environment variables before proceeding
const { validateOnStartup } = require('./utils/validateEnv');
if (process.env.NODE_ENV !== 'test') {
  validateOnStartup(true); // Exit on validation errors
}

// Application modules
const app = require('./app');                           // Express app
const config = require('../config');                    // Configuration
const logger = require('./utils/logger');               // Winston logger
const db = require('./database');                       // PostgreSQL connection
const redis = require('./database/redis');              // Redis connection
const queueManager = require('./services/queueManager'); // Background job processing

// Note: All Express middleware and routes are configured in app.js
// This file handles server startup, database connections, and graceful shutdown

/**
 * Global Server Instance
 */
let server;

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

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Initialize and start the application
  startServer();
}

// Export app for testing
module.exports = app;
