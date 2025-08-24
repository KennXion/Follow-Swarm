/**
 * Test script for Spotify OAuth authentication
 * Run this after starting the server to test the auth flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthEndpoints() {
  console.log('🧪 Testing Spotify Follow-Swarm Authentication\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');
    
    // Test auth status (should be unauthenticated)
    console.log('2. Testing auth status (unauthenticated)...');
    const statusResponse = await axios.get(`${BASE_URL}/auth/status`);
    console.log('✅ Auth status:', statusResponse.data);
    console.log('');
    
    // Get OAuth URL
    console.log('3. OAuth Flow Instructions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('To test the complete OAuth flow:');
    console.log('');
    console.log('1. Make sure you have Spotify credentials in your .env file:');
    console.log('   - SPOTIFY_CLIENT_ID');
    console.log('   - SPOTIFY_CLIENT_SECRET');
    console.log('   - SPOTIFY_REDIRECT_URI=http://localhost:3001/auth/callback');
    console.log('');
    console.log('2. Open this URL in your browser:');
    console.log(`   🔗 ${BASE_URL}/auth/spotify`);
    console.log('');
    console.log('3. Log in with your Spotify account');
    console.log('');
    console.log('4. After authorization, you will be redirected back and see your user data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests
testAuthEndpoints();