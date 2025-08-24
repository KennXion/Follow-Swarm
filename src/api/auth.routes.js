const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const config = require('../../config');
const spotifyAuth = require('../auth/spotify');
const { isAuthenticated, generateApiToken } = require('../middleware/auth');
const db = require('../database');
const redis = require('../database/redis');
const logger = require('../utils/logger');

/**
 * GET /auth/spotify
 * Initiate Spotify OAuth flow
 */
router.get('/spotify', async (req, res) => {
  try {
    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in Redis with 10 minute expiry
    await redis.client.set(`oauth_state:${state}`, 'valid', 'EX', 600);
    
    // Get authorization URL
    const authUrl = spotifyAuth.getAuthorizationUrl(state);
    
    logger.info('Initiating Spotify OAuth flow');
    
    // Redirect to Spotify
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Failed to initiate OAuth:', error);
    res.status(500).json({
      error: 'OAuth initiation failed',
      message: 'Failed to start authentication process'
    });
  }
});

/**
 * GET /auth/callback
 * Handle Spotify OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: spotifyError } = req.query;
    
    // Check for Spotify error
    if (spotifyError) {
      logger.error('Spotify OAuth error:', spotifyError);
      return res.redirect(`${config.server.env === 'production' ? 'https' : 'http'}://${config.server.host}:${config.server.port}/auth/error?message=${encodeURIComponent(spotifyError)}`);
    }
    
    // Verify state for CSRF protection using Redis
    const stateKey = `oauth_state:${state}`;
    const storedState = await redis.client.get(stateKey);
    
    if (!state || !storedState) {
      logger.warn('Invalid OAuth state');
      return res.status(400).json({
        error: 'Invalid state',
        message: 'Authentication failed - invalid state parameter'
      });
    }
    
    // Clear state from Redis
    await redis.client.del(stateKey);
    
    // Exchange code for tokens
    const tokens = await spotifyAuth.exchangeCodeForTokens(code);
    
    // Get user profile from Spotify
    const profile = await spotifyAuth.getUserProfile(tokens.accessToken);
    
    // Save or update user in database
    const user = await spotifyAuth.saveOrUpdateUser(profile);
    
    // Save tokens
    await spotifyAuth.saveTokens(user.id, tokens);
    
    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      spotifyId: user.spotify_id,
      displayName: user.display_name,
      email: user.email,
      subscriptionTier: user.subscription_tier
    };
    
    // Track login event
    await db.insert('analytics', {
      user_id: user.id,
      event_type: 'login',
      event_category: 'auth',
      event_data: { method: 'spotify_oauth' }
    });
    
    logger.info(`User ${user.spotify_id} logged in successfully`);
    
    // Generate API token
    const apiToken = generateApiToken(user.id);
    
    // Send HTML page that redirects via JavaScript (avoids cross-origin issues)
    const frontendUrl = config.server.env === 'production' 
      ? 'https://spotifyswarm.com' 
      : 'http://localhost:5173';
    
    const redirectUrl = `${frontendUrl}/auth/success?token=${apiToken}&userId=${user.id}`;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #191414;
            color: white;
          }
          .container {
            text-align: center;
          }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-left-color: #1DB954;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>Authentication Successful!</h2>
          <p>Redirecting you to the dashboard...</p>
        </div>
        <script>
          window.location.href = '${redirectUrl}';
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Failed to complete authentication process'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get new access token
    const accessToken = await spotifyAuth.getValidAccessToken(userId);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Failed to refresh access token'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Track logout event
    await db.insert('analytics', {
      user_id: userId,
      event_type: 'logout',
      event_category: 'auth',
      event_data: {}
    });
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction error:', err);
      }
    });
    
    // Optionally revoke tokens (uncomment if you want to force re-authentication)
    // await spotifyAuth.revokeTokens(userId);
    
    logger.info(`User ${userId} logged out`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Failed to logout'
    });
  }
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', async (req, res) => {
  try {
    if (req.session && req.session.userId) {
      const user = await db.findOne('users', { id: req.session.userId });
      
      if (user) {
        // Check if tokens are valid
        let hasValidTokens = false;
        try {
          await spotifyAuth.getValidAccessToken(user.id);
          hasValidTokens = true;
        } catch (error) {
          logger.debug('User has invalid tokens');
        }
        
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            spotifyId: user.spotify_id,
            displayName: user.display_name,
            email: user.email,
            profileImage: user.profile_image_url,
            subscriptionTier: user.subscription_tier
          },
          hasValidTokens
        });
      }
    }
    
    res.json({
      authenticated: false,
      user: null,
      hasValidTokens: false
    });
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: 'Failed to check authentication status'
    });
  }
});

/**
 * POST /auth/revoke
 * Revoke Spotify tokens (force re-authentication)
 */
router.post('/revoke', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Revoke tokens
    await spotifyAuth.revokeTokens(userId);
    
    // Clear session
    req.session.destroy();
    
    logger.info(`Revoked tokens for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Tokens revoked successfully'
    });
  } catch (error) {
    logger.error('Token revocation error:', error);
    res.status(500).json({
      error: 'Revocation failed',
      message: 'Failed to revoke tokens'
    });
  }
});

module.exports = router;