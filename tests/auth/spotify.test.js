/**
 * Spotify Authentication Module Tests
 */

// Mock Spotify Web API before requiring the module
jest.mock('spotify-web-api-node', () => {
  return jest.fn().mockImplementation(() => ({
    createAuthorizeURL: jest.fn(),
    authorizationCodeGrant: jest.fn(),
    setRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    setAccessToken: jest.fn(),
    getMe: jest.fn()
  }));
});

// Mock encryption module
jest.mock('../../src/utils/encryption', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn()
}));

const spotifyAuth = require('../../src/auth/spotify');
const db = require('../../src/database');
const redis = require('../../src/database/redis');
const encryption = require('../../src/utils/encryption');

describe('Spotify Authentication', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('getAuthorizationUrl()', () => {
    it('should generate authorization URL with state', () => {
      const state = 'test_state_123';
      
      spotifyAuth.spotifyApi.createAuthorizeURL = jest.fn().mockReturnValue(
        `https://accounts.spotify.com/authorize?state=${state}`
      );
      
      const url = spotifyAuth.getAuthorizationUrl(state);
      
      expect(url).toContain('https://accounts.spotify.com/authorize');
      expect(url).toContain(state);
      expect(spotifyAuth.spotifyApi.createAuthorizeURL).toHaveBeenCalledWith(
        expect.any(Array),
        state
      );
    });
  });
  
  describe('exchangeCodeForTokens()', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockTokenData = {
        body: {
          'access_token': 'mock_access_token',
          'refresh_token': 'mock_refresh_token',
          'expires_in': 3600,
          'scope': 'user-read-email user-follow-read'
        }
      };
      
      spotifyAuth.spotifyApi.authorizationCodeGrant = jest.fn().mockResolvedValue(mockTokenData);
      
      const tokens = await spotifyAuth.exchangeCodeForTokens('auth_code_123');
      
      expect(tokens).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 3600,
        scope: 'user-read-email user-follow-read'
      });
    });
    
    it('should handle token exchange errors', async () => {
      spotifyAuth.spotifyApi.authorizationCodeGrant = jest.fn().mockRejectedValue(
        new Error('Invalid authorization code')
      );
      
      await expect(spotifyAuth.exchangeCodeForTokens('invalid_code'))
        .rejects
        .toThrow('Failed to authenticate with Spotify');
    });
  });
  
  describe('refreshAccessToken()', () => {
    it('should refresh access token using refresh token', async () => {
      const mockRefreshData = {
        body: {
          'access_token': 'new_access_token',
          'expires_in': 3600
        }
      };
      
      spotifyAuth.spotifyApi.setRefreshToken = jest.fn();
      spotifyAuth.spotifyApi.refreshAccessToken = jest.fn().mockResolvedValue(mockRefreshData);
      
      const result = await spotifyAuth.refreshAccessToken('refresh_token_123');
      
      expect(spotifyAuth.spotifyApi.setRefreshToken).toHaveBeenCalledWith('refresh_token_123');
      expect(result).toEqual({
        accessToken: 'new_access_token',
        expiresIn: 3600
      });
    });
    
    it('should handle refresh token errors', async () => {
      spotifyAuth.spotifyApi.setRefreshToken = jest.fn();
      spotifyAuth.spotifyApi.refreshAccessToken = jest.fn().mockRejectedValue(
        new Error('Invalid refresh token')
      );
      
      await expect(spotifyAuth.refreshAccessToken('invalid_token'))
        .rejects
        .toThrow('Failed to refresh authentication');
    });
  });
  
  describe('getUserProfile()', () => {
    it('should fetch user profile from Spotify', async () => {
      const mockProfileData = {
        body: {
          id: 'user123',
          email: 'test@example.com',
          display_name: 'Test User',
          images: [{ url: 'https://example.com/avatar.jpg' }],
          country: 'US',
          followers: { total: 100 }
        }
      };
      
      spotifyAuth.spotifyApi.setAccessToken = jest.fn();
      spotifyAuth.spotifyApi.getMe = jest.fn().mockResolvedValue(mockProfileData);
      
      const profile = await spotifyAuth.getUserProfile('access_token_123');
      
      expect(spotifyAuth.spotifyApi.setAccessToken).toHaveBeenCalledWith('access_token_123');
      expect(profile).toEqual({
        spotifyId: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        profileImageUrl: 'https://example.com/avatar.jpg',
        country: 'US',
        followers: 100
      });
    });
    
    it('should handle missing profile image', async () => {
      const mockProfileData = {
        body: {
          id: 'user123',
          email: 'test@example.com',
          display_name: 'Test User',
          images: [],
          country: 'US',
          followers: { total: 0 }
        }
      };
      
      spotifyAuth.spotifyApi.setAccessToken = jest.fn();
      spotifyAuth.spotifyApi.getMe = jest.fn().mockResolvedValue(mockProfileData);
      
      const profile = await spotifyAuth.getUserProfile('access_token_123');
      
      expect(profile.profileImageUrl).toBeNull();
    });
    
    it('should handle profile fetch errors', async () => {
      spotifyAuth.spotifyApi.setAccessToken = jest.fn();
      spotifyAuth.spotifyApi.getMe = jest.fn().mockRejectedValue(
        new Error('Unauthorized')
      );
      
      await expect(spotifyAuth.getUserProfile('invalid_token'))
        .rejects
        .toThrow('Failed to fetch user profile');
    });
  });
  
  describe('saveOrUpdateUser()', () => {
    it('should create new user if not exists', async () => {
      const profile = {
        spotifyId: 'new_user_123',
        email: 'new@example.com',
        displayName: 'New User',
        profileImageUrl: 'https://example.com/avatar.jpg',
        country: 'US'
      };
      
      db.findOne = jest.fn().mockResolvedValue(null);
      db.insert = jest.fn().mockResolvedValue({
        id: 1,
        spotify_id: 'new_user_123',
        email: 'new@example.com',
        display_name: 'New User'
      });
      
      const user = await spotifyAuth.saveOrUpdateUser(profile);
      
      expect(db.findOne).toHaveBeenCalledWith('users', { spotify_id: 'new_user_123' });
      expect(db.insert).toHaveBeenCalledWith('users', expect.objectContaining({
        spotify_id: 'new_user_123',
        email: 'new@example.com',
        display_name: 'New User'
      }));
      expect(user).toHaveProperty('id', 1);
    });
    
    it('should update existing user', async () => {
      const profile = {
        spotifyId: 'existing_user_123',
        email: 'updated@example.com',
        displayName: 'Updated User',
        profileImageUrl: 'https://example.com/new_avatar.jpg',
        country: 'UK'
      };
      
      const existingUser = {
        id: 1,
        spotify_id: 'existing_user_123',
        email: 'old@example.com',
        display_name: 'Old User'
      };
      
      db.findOne = jest.fn().mockResolvedValue(existingUser);
      db.update = jest.fn().mockResolvedValue({
        ...existingUser,
        email: 'updated@example.com',
        display_name: 'Updated User'
      });
      
      const user = await spotifyAuth.saveOrUpdateUser(profile);
      
      expect(db.findOne).toHaveBeenCalledWith('users', { spotify_id: 'existing_user_123' });
      expect(db.update).toHaveBeenCalledWith('users', 1, expect.objectContaining({
        email: 'updated@example.com',
        display_name: 'Updated User'
      }));
      expect(user).toHaveProperty('id', 1);
    });
  });
  
  describe('saveTokens()', () => {
    it('should save encrypted tokens', async () => {
      const userId = 'user123';
      const tokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600
      };
      
      encryption.encrypt = jest.fn().mockReturnValue('encrypted_token');
      db.findOne = jest.fn().mockResolvedValue(null);
      db.insert = jest.fn().mockResolvedValue({ id: 1 });
      redis.cacheToken = jest.fn().mockResolvedValue('OK');
      
      await spotifyAuth.saveTokens(userId, tokens);
      
      expect(encryption.encrypt).toHaveBeenCalledWith('access_token_123');
      expect(encryption.encrypt).toHaveBeenCalledWith('refresh_token_123');
      expect(db.findOne).toHaveBeenCalledWith('oauth_tokens', { user_id: userId });
      expect(db.insert).toHaveBeenCalledWith(
        'oauth_tokens',
        expect.objectContaining({
          user_id: userId,
          access_token: 'encrypted_token',
          refresh_token: 'encrypted_token'
        })
      );
    });
    
    it('should handle token save errors', async () => {
      const userId = 'user123';
      const tokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600
      };
      
      encryption.encrypt = jest.fn().mockReturnValue('encrypted_token');
      db.findOne = jest.fn().mockResolvedValue(null);
      db.insert = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(spotifyAuth.saveTokens(userId, tokens))
        .rejects
        .toThrow('Database error');
    });
  });
  
  describe('getValidAccessToken()', () => {
    it('should return cached token if valid', async () => {
      const userId = 'user123';
      
      redis.getCachedToken = jest.fn().mockResolvedValue({
        accessToken: 'cached_access_token',
        expiresAt: new Date(Date.now() + 3600000) // Valid for 1 hour
      });
      
      const token = await spotifyAuth.getValidAccessToken(userId);
      
      expect(token).toBe('cached_access_token');
      expect(redis.getCachedToken).toHaveBeenCalledWith(userId);
    });
    
    it('should refresh token if expired', async () => {
      const userId = 'user123';
      const expiredToken = {
        access_token: 'expired_token',
        refresh_token: 'encrypted_refresh_token',
        expires_at: new Date(Date.now() - 1000) // Expired
      };
      
      redis.getCachedToken = jest.fn().mockResolvedValue(null);
      db.findOne = jest.fn().mockResolvedValue(expiredToken);
      encryption.decrypt = jest.fn().mockReturnValue('refresh_token_123');
      
      spotifyAuth.refreshAccessToken = jest.fn().mockResolvedValue({
        accessToken: 'new_access_token',
        expiresIn: 3600
      });
      
      encryption.encrypt = jest.fn().mockReturnValue('encrypted_new_token');
      db.update = jest.fn().mockResolvedValue({});
      redis.cacheToken = jest.fn().mockResolvedValue('OK');
      
      const token = await spotifyAuth.getValidAccessToken(userId);
      
      expect(token).toBe('new_access_token');
      expect(spotifyAuth.refreshAccessToken).toHaveBeenCalledWith('refresh_token_123');
    });
    
    it('should throw if no tokens found', async () => {
      const userId = 'user123';
      
      redis.getCachedToken = jest.fn().mockResolvedValue(null);
      db.findOne = jest.fn().mockResolvedValue(null);
      
      await expect(spotifyAuth.getValidAccessToken(userId))
        .rejects
        .toThrow('No tokens found for user');
    });
  });
  
  describe('revokeTokens()', () => {
    it('should delete tokens from database and cache', async () => {
      const userId = 'user123';
      
      db.findOne = jest.fn().mockResolvedValue({ id: 'token123', user_id: userId });
      db.delete = jest.fn().mockResolvedValue({ rows: [] });
      redis.invalidateToken = jest.fn().mockResolvedValue(1);
      
      await spotifyAuth.revokeTokens(userId);
      
      expect(db.findOne).toHaveBeenCalledWith('oauth_tokens', { user_id: userId });
      expect(db.delete).toHaveBeenCalledWith('oauth_tokens', 'token123');
      expect(redis.invalidateToken).toHaveBeenCalledWith(userId);
    });
  });
});