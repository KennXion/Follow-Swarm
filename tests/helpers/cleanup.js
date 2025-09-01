/**
 * Test Cleanup Helper
 * 
 * Ensures all resources are properly closed after tests to prevent
 * hanging processes and memory leaks.
 */

const db = require('../../src/database');
const logger = require('../../src/utils/logger');

/**
 * Clean up all test resources
 */
async function cleanupTestResources() {
  try {
    // Close database connections
    if (db && db.pool) {
      await db.disconnect();
    }

    // Clear all timers
    clearInterval();
    clearTimeout();
    
    // Clear any pending promises
    await new Promise(resolve => setImmediate(resolve));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Setup global test lifecycle hooks
 */
function setupTestLifecycle() {
  // Increase default test timeout
  jest.setTimeout(10000);

  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestResources();
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection in test:', error);
  });
}

module.exports = {
  cleanupTestResources,
  setupTestLifecycle
};