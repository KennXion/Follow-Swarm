/**
 * Logger Module
 * 
 * Centralized logging system for the Follow-Swarm application using Winston.
 * Provides structured logging with different levels, formats, and transports.
 * Supports console output with colors in development and file logging in production.
 */

const winston = require('winston');
const config = require('../../config');

// Define custom log levels with priority values (lower = more important)
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Color scheme for console output in development
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Apply color configuration to Winston
winston.addColors(colors);

// Default format for structured logging (JSON format for production)
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
  winston.format.errors({ stack: true }), // Include stack traces for errors
  winston.format.splat(), // String interpolation support
  winston.format.json() // Output as JSON for easy parsing
);

// Human-readable format for development console output
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }), // Apply colors to all output
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // Custom format function for readable console output
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Format metadata if present
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2); // Pretty print metadata
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Configure logging transports (where logs are sent)
const transports = [
  // Console transport: Shows logs in terminal
  new winston.transports.Console({
    format: config.server.env === 'development' ? consoleFormat : format, // Use colors in dev
    level: config.logging.level // Minimum level to log
  })
];

// Production: Add persistent file logging for audit trail and debugging
if (config.server.env === 'production') {
  transports.push(
    // Error log file: Critical issues only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', // Only error level and above
      maxsize: 5242880, // 5MB per file
      maxFiles: 5 // Keep 5 rotated files
    }),
    // Combined log file: All log levels
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB per file
      maxFiles: 5 // Keep 5 rotated files
    })
  );
}

// Create the main logger instance
const logger = winston.createLogger({
  levels: logLevels, // Use custom log levels
  format, // Default format
  transports, // Output destinations
  exitOnError: false // Don't exit on handled exceptions
});

/**
 * Stream adapter for Morgan HTTP request logging
 * Allows Express middleware to write HTTP logs through Winston
 */
logger.stream = {
  write: (message) => {
    // Remove trailing newline and log as HTTP level
    logger.http(message.trim());
  }
};

// Export configured logger for use throughout application
module.exports = logger;