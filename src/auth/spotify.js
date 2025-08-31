/**
 * Spotify Authentication Module
 * 
 * Handles all Spotify OAuth 2.0 authentication flows and token management.
 * Provides methods for user authentication, token refresh, and secure token storage.
 * Integrates with Spotify Web API for user profile and follow operations.
 */

const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config');
const logger = require('../utils/logger');
const encryption = require('../utils/encryption');
const db = require('../database');
const redis = require('../database/redis');

/**
 * SpotifyAuth Class
 * 
 * Manages Spotify OAuth flow, token lifecycle, and user profile operations.
 * All tokens are encrypted before storage and cached for performance.
 */
class SpotifyAuth {
  constructor() {
    // Initialize Spotify Web API client with OAuth credentials
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
      redirectUri: config.spotify.redirectUri
    });
  }

  /**
   * Generate authorization URL for OAuth flow
   * @param {string} state - State parameter for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    const scopes = config.spotify.scopes;
    logger.info(`Creating auth URL with redirect URI: ${config.spotify.redirectUri}`);
    logger.info(`Redirect URI type: ${typeof config.spotify.redirectUri}`);
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code from Spotify
   * @returns {Object} Token data
   */
  async exchangeCodeForTokens(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      
      return {
        accessToken: data.body['access_token'],
        refreshToken: data.body['refresh_token'],
        expiresIn: data.body['expires_in'],
        scope: data.body['scope']
      };
    } catch (error) {
      logger.error('Failed to exchange code for tokens:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token data
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      
      return {
        accessToken: data.body['access_token'],
        expiresIn: data.body['expires_in']
      };
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh authentication');
    }
  }

  /**
   * Get user profile from Spotify
   * @param {string} accessToken - Access token
   * @returns {Object} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      
      return {
        spotifyId: data.body.id,
        email: data.body.email,
        displayName: data.body.display_name,
        profileImageUrl: data.body.images?.[0]?.url || null,
        country: data.body.country,
        product: data.body.product,
        followers: data.body.followers?.total || 0
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Save or update user in database
   * @param {Object} profile - User profile from Spotify
   * @returns {Object} User record
   */
  async saveOrUpdateUser(profile) {
    try {
      // Check if user already exists in database
      const existingUser = await db.findOne('users', { spotify_id: profile.spotifyId });
      
      if (existingUser) {
        // Update existing user's profile information
        const updatedUser = await db.update('users', existingUser.id, {
          email: profile.email,
          display_name: profile.displayName,
          profile_image_url: profile.profileImageUrl,
          country: profile.country,
          product: profile.product
        });
        
        logger.info(`Updated user: ${profile.spotifyId}`);
        return updatedUser;
      } else {
        // Create new user account
        const newUser = await db.insert('users', {
          spotify_id: profile.spotifyId,
          email: profile.email,
          display_name: profile.displayName,
          profile_image_url: profile.profileImageUrl,
          country: profile.country,
          product: profile.product,
          subscription_tier: 'free' // New users start with free tier
        });
        
        logger.info(`Created new user: ${profile.spotifyId}`);
        
        // Track signup event for analytics
        await db.insert('analytics', {
          user_id: newUser.id,
          event_type: 'signup',
          event_category: 'user',
          event_data: { source: 'spotify_oauth' }
        });
        
        return newUser;
      }
    } catch (error) {
      logger.error('Failed to save/update user:', error);
      throw error;
    }
  }

  /**
   * Save OAuth tokens to database (encrypted)
   * @param {string} userId - User ID
   * @param {Object} tokens - Token data
   */
  async saveTokens(userId, tokens) {
    try {
      // Encrypt tokens before storage for security
      const encryptedAccessToken = encryption.encrypt(tokens.accessToken);
      const encryptedRefreshToken = encryption.encrypt(tokens.refreshToken);
      // Calculate token expiration time
      const expiresAt = new Date(Date.now() + (tokens.expiresIn * 1000));
      
      // Check if user already has tokens stored
      const existingTokens = await db.findOne('oauth_tokens', { user_id: userId });
      
      if (existingTokens) {
        // Update existing token record
        await db.update('oauth_tokens', existingTokens.id, {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          scope: tokens.scope
        });
      } else {
        // Create new token record
        await db.insert('oauth_tokens', {
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          scope: tokens.scope
        });
      }
      
      // Cache unencrypted tokens in Redis for quick access
      // Redis data is encrypted at rest and in transit
      await redis.cacheToken(userId, {
        accessToken: tokens.accessToken,
        expiresAt: expiresAt.toISOString()
      }, tokens.expiresIn);
      
      logger.debug(`Saved tokens for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to save tokens:', error);
      throw error;
    }
  }

  /**
   * Get valid access token for user (refresh if needed)
   * @param {string} userId - User ID
   * @returns {string} Valid access token
   */
  async getValidAccessToken(userId) {
    try {
      // Check Redis cache first for performance
      const cachedToken = await redis.getCachedToken(userId);
      if (cachedToken && new Date(cachedToken.expiresAt) > new Date()) {
        return cachedToken.accessToken;
      }
      
      // Fallback to database if not in cache
      const tokenRecord = await db.findOne('oauth_tokens', { user_id: userId });
      if (!tokenRecord) {
        throw new Error('No tokens found for user');
      }
      
      // Check if token is still valid
      if (new Date(tokenRecord.expires_at) > new Date(Date.now() + 60000)) {
        // Token is valid (with 1 minute buffer for safety)
        const decryptedToken = encryption.decrypt(tokenRecord.access_token);
        
        // Re-cache the valid token
        await redis.cacheToken(userId, {
          accessToken: decryptedToken,
          expiresAt: tokenRecord.expires_at
        });
        
        return decryptedToken;
      }
      
      // Token expired, use refresh token to get new access token
      const decryptedRefreshToken = encryption.decrypt(tokenRecord.refresh_token);
      const newTokens = await this.refreshAccessToken(decryptedRefreshToken);
      
      // Save new access token (keep existing refresh token)
      await this.saveTokens(userId, {
        ...newTokens,
        refreshToken: decryptedRefreshToken, // Refresh token doesn't change
        scope: tokenRecord.scope
      });
      
      return newTokens.accessToken;
    } catch (error) {
      logger.error('Failed to get valid access token:', error);
      throw error;
    }
  }

  /**
   * Revoke user tokens (logout)
   * @param {string} userId - User ID
   */
  async revokeTokens(userId) {
    try {
      // Remove tokens from database
      const tokenRecord = await db.findOne('oauth_tokens', { user_id: userId });
      if (tokenRecord) {
        await db.delete('oauth_tokens', tokenRecord.id);
      }
      
      // Clear tokens from Redis cache
      await redis.invalidateToken(userId);
      
      logger.info(`Revoked tokens for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to revoke tokens:', error);
      throw error;
    }
  }
}

// Export singleton instance for consistent Spotify API access
module.exports = new SpotifyAuth();