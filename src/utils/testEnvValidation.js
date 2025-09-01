#!/usr/bin/env node

/**
 * Test script for environment validation
 */

const { validateEnvironment } = require('./validateEnv');

console.log('🧪 Testing Environment Variable Validation\n');

// Save current env
const originalEnv = { ...process.env };

// Test 1: Missing required variables
console.log('Test 1: Missing required variables');
process.env = {
  NODE_ENV: 'development'
};
let result = validateEnvironment();
console.log(`  ❌ Should fail: ${!result.valid ? 'PASSED' : 'FAILED'}`);
console.log(`  Missing: ${result.missing.join(', ')}\n`);

// Test 2: Invalid values
console.log('Test 2: Invalid port number');
process.env = {
  ...originalEnv,
  PORT: '99999'
};
result = validateEnvironment();
const hasPortError = result.errors.some(e => e.includes('PORT'));
console.log(`  ❌ Should fail: ${hasPortError ? 'PASSED' : 'FAILED'}\n`);

// Test 3: Invalid URL format
console.log('Test 3: Invalid URL format');
process.env = {
  ...originalEnv,
  SPOTIFY_REDIRECT_URI: 'not-a-valid-url'
};
result = validateEnvironment();
const hasUrlError = result.errors.some(e => e.includes('SPOTIFY_REDIRECT_URI'));
console.log(`  ❌ Should fail: ${hasUrlError ? 'PASSED' : 'FAILED'}\n`);

// Test 4: Short security keys
console.log('Test 4: Security key too short');
process.env = {
  ...originalEnv,
  JWT_SECRET: 'too-short'
};
result = validateEnvironment();
const hasLengthError = result.errors.some(e => e.includes('32 characters'));
console.log(`  ❌ Should fail: ${hasLengthError ? 'PASSED' : 'FAILED'}\n`);

// Test 5: Valid configuration
console.log('Test 5: Valid configuration');
process.env = {
  ...originalEnv,
  SPOTIFY_CLIENT_ID: 'test_client_id',
  SPOTIFY_CLIENT_SECRET: 'test_client_secret',
  SPOTIFY_REDIRECT_URI: 'http://localhost:3001/callback',
  DATABASE_URL: 'postgresql://localhost:5432/test',
  JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
  ENCRYPTION_KEY: 'another-very-long-secret-key-for-encryption-testing',
  SESSION_SECRET: 'yet-another-very-long-secret-for-session-management'
};
result = validateEnvironment();
console.log(`  ✅ Should pass: ${result.valid ? 'PASSED' : 'FAILED'}`);
if (!result.valid) {
  console.log(`  Errors: ${result.errors.join(', ')}`);
}

// Restore original env
process.env = originalEnv;

console.log('\n✅ All validation tests completed');