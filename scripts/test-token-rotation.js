#!/usr/bin/env node

/**
 * Test script for token rotation functionality
 * Verifies the refactored modules work correctly
 */

const spotifyAuth = require('../src/auth/spotify');
const tokenRotation = require('../src/auth/tokenRotation');
const tokenManager = require('../src/auth/tokenManager');
const db = require('../src/database');
const logger = require('../src/utils/logger');

async function testTokenRotation() {
  logger.info('Starting token rotation test...');
  
  try {
    // Connect to database
    await db.connect();
    logger.info('✓ Database connected');
    
    // Test 1: Check if modules load correctly
    logger.info('Testing module imports...');
    if (!spotifyAuth || !tokenRotation || !tokenManager) {
      throw new Error('Module import failed');
    }
    logger.info('✓ All modules loaded successfully');
    
    // Test 2: Check if methods exist
    logger.info('Testing method availability...');
    const methods = [
      { obj: spotifyAuth, method: 'refreshAccessToken' },
      { obj: spotifyAuth, method: 'saveTokens' },
      { obj: spotifyAuth, method: 'refreshExpiringTokens' },
      { obj: tokenRotation, method: 'trackTokenRefresh' },
      { obj: tokenRotation, method: 'prepareRotationData' },
      { obj: tokenManager, method: 'saveTokens' },
      { obj: tokenManager, method: 'revokeTokens' }
    ];
    
    for (const { obj, method } of methods) {
      if (typeof obj[method] !== 'function') {
        throw new Error(`Method ${method} not found`);
      }
    }
    logger.info('✓ All required methods available');
    
    // Test 3: Check for expiring tokens
    logger.info('Checking for expiring tokens...');
    const result = await spotifyAuth.refreshExpiringTokens(60); // 60 min buffer for testing
    logger.info(`✓ Token refresh check completed. Refreshed ${result.length} tokens`);
    
    // Test 4: Test rotation data preparation
    logger.info('Testing rotation data preparation...');
    const mockExisting = { token_version: 1, refresh_count: 5 };
    const mockNew = { access_token: 'new', refresh_token: 'new' };
    const rotationData = tokenRotation.prepareRotationData(mockExisting, mockNew);
    
    if (rotationData.token_version !== 2 || rotationData.refresh_count !== 6) {
      throw new Error('Rotation data preparation failed');
    }
    logger.info('✓ Rotation data preparation works correctly');
    
    logger.info('\n✅ All tests passed! Token rotation is working correctly.');
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run tests
testTokenRotation();