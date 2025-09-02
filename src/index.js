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
const { SSLConfig, httpsRedirect, getSSLConfig } = require('../ssl/ssl-config'); // SSL configuration

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
 * Initializes all connections and starts HTTP/HTTPS servers
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
    
    // Get SSL configuration for current environment
    const sslConfig = getSSLConfig();
    
    if (sslConfig.enabled && config.server.env === 'production') {
      // Production: Start HTTPS server with SSL
      try {
        const sslManager = new SSLConfig();
        const httpsServer = sslManager.createHTTPSServer(app, sslConfig.port);
        
        httpsServer.listen(sslConfig.port, () => {
          logger.info(`HTTPS server running on port ${sslConfig.port}`);
          logger.info(`Environment: ${config.server.env}`);
          logger.info(`Health check: https://localhost:${sslConfig.port}/health`);
        });
        
        // Start HTTP server for redirects if needed
        if (sslConfig.redirectHttp) {
          const http = require('http');
          const httpApp = require('express')();
          httpApp.use(httpsRedirect);
          
          const httpServer = http.createServer(httpApp);
          httpServer.listen(config.server.port, () => {
            logger.info(`HTTP redirect server running on port ${config.server.port}`);
          });
        }
        
        global.server = httpsServer;
        
      } catch (sslError) {
        logger.error('Failed to start HTTPS server:', sslError);
        logger.info('Falling back to HTTP server...');
        startHTTPServer();
      }
    } else {
      // Development/Staging: Start HTTP server
      startHTTPServer();
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Start HTTP Server (fallback or development)
 */
const startHTTPServer = () => {
  const port = config.server.port;
  const server = app.listen(port, () => {
    logger.info(`HTTP server running on port ${port}`);
    logger.info(`Environment: ${config.server.env}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    
    if (config.server.env === 'development') {
      logger.info(`Spotify OAuth: http://localhost:${port}/auth/spotify`);
    }
    
    if (config.server.env === 'production') {
      logger.warn('Running HTTP in production - SSL/TLS recommended');
    }
  });
  
  global.server = server;
};

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Initialize and start the application
  startServer();
}

// Export app for testing
module.exports = app;
