const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config');
const logger = require('../utils/logger');
const encryption = require('../utils/encryption');
const db = require('../database');
const redis = require('../database/redis');

class SpotifyAuth {
  constructor() {
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
      const existingUser = await db.findOne('users', { spotify_id: profile.spotifyId });
      
      if (existingUser) {
        // Update existing user
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
        // Create new user
        const newUser = await db.insert('users', {
          spotify_id: profile.spotifyId,
          email: profile.email,
          display_name: profile.displayName,
          profile_image_url: profile.profileImageUrl,
          country: profile.country,
          product: profile.product,
          subscription_tier: 'free'
        });
        
        logger.info(`Created new user: ${profile.spotifyId}`);
        
        // Track signup event
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
      const encryptedAccessToken = encryption.encrypt(tokens.accessToken);
      const encryptedRefreshToken = encryption.encrypt(tokens.refreshToken);
      const expiresAt = new Date(Date.now() + (tokens.expiresIn * 1000));
      
      // Check if tokens already exist
      const existingTokens = await db.findOne('oauth_tokens', { user_id: userId });
      
      if (existingTokens) {
        // Update existing tokens
        await db.update('oauth_tokens', existingTokens.id, {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          scope: tokens.scope
        });
      } else {
        // Insert new tokens
        await db.insert('oauth_tokens', {
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          scope: tokens.scope
        });
      }
      
      // Cache tokens in Redis for quick access
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
      // Check Redis cache first
      const cachedToken = await redis.getCachedToken(userId);
      if (cachedToken && new Date(cachedToken.expiresAt) > new Date()) {
        return cachedToken.accessToken;
      }
      
      // Get tokens from database
      const tokenRecord = await db.findOne('oauth_tokens', { user_id: userId });
      if (!tokenRecord) {
        throw new Error('No tokens found for user');
      }
      
      // Check if token is expired
      if (new Date(tokenRecord.expires_at) > new Date(Date.now() + 60000)) {
        // Token is still valid (with 1 minute buffer)
        const decryptedToken = encryption.decrypt(tokenRecord.access_token);
        
        // Cache it
        await redis.cacheToken(userId, {
          accessToken: decryptedToken,
          expiresAt: tokenRecord.expires_at
        });
        
        return decryptedToken;
      }
      
      // Token expired, refresh it
      const decryptedRefreshToken = encryption.decrypt(tokenRecord.refresh_token);
      const newTokens = await this.refreshAccessToken(decryptedRefreshToken);
      
      // Save new tokens
      await this.saveTokens(userId, {
        ...newTokens,
        refreshToken: decryptedRefreshToken,
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
      // Delete from database
      const tokenRecord = await db.findOne('oauth_tokens', { user_id: userId });
      if (tokenRecord) {
        await db.delete('oauth_tokens', tokenRecord.id);
      }
      
      // Clear from Redis cache
      await redis.invalidateToken(userId);
      
      logger.info(`Revoked tokens for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to revoke tokens:', error);
      throw error;
    }
  }
}

module.exports = new SpotifyAuth();