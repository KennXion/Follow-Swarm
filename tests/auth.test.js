const request = require('supertest');
const app = require('../src/index');
const db = require('../src/database');
const spotifyAuth = require('../src/auth/spotify');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('GET /auth/spotify', () => {
    it('should redirect to Spotify OAuth', async () => {
      const response = await request(app)
        .get('/auth/spotify')
        .expect(302);
      
      expect(response.headers.location).toContain('accounts.spotify.com');
      expect(response.headers.location).toContain('client_id');
      expect(response.headers.location).toContain('redirect_uri');
    });
  });

  describe('GET /auth/status', () => {
    it('should return unauthenticated when no session', async () => {
      const response = await request(app)
        .get('/auth/status')
        .expect(200);
      
      expect(response.body).toEqual({
        authenticated: false,
        user: null
      });
    });

    it('should return authenticated with user data when logged in', async () => {
      // Mock authenticated session
      const agent = request.agent(app);
      
      // Create test user
      const testUser = await db.insert('users', {
        spotify_id: 'test_spotify_id',
        email: 'test@example.com',
        display_name: 'Test User'
      });

      // Mock session
      const response = await agent
        .get('/auth/status')
        .set('Cookie', [`connect.sid=test_session`])
        .expect(200);
      
      // Clean up
      await db.delete('users', testUser.id);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear session and return success', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);
      
      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });

  describe('Spotify OAuth Service', () => {
    describe('Token Encryption', () => {
      it('should encrypt and decrypt tokens correctly', () => {
        const originalToken = 'test_access_token_123';
        
        const encrypted = spotifyAuth.encryptTokens(originalToken);
        expect(encrypted).not.toBe(originalToken);
        expect(encrypted).toContain(':'); // Should have IV separator
        
        const decrypted = spotifyAuth.decryptTokens(encrypted);
        expect(decrypted).toEqual({ accessToken: originalToken });
      });

      it('should generate different encrypted values for same token', () => {
        const token = 'test_token';
        const encrypted1 = spotifyAuth.encryptTokens(token);
        const encrypted2 = spotifyAuth.encryptTokens(token);
        
        expect(encrypted1).not.toBe(encrypted2); // Different IVs
        
        // But both should decrypt to same value
        expect(spotifyAuth.decryptTokens(encrypted1)).toEqual(
          spotifyAuth.decryptTokens(encrypted2)
        );
      });
    });

    describe('Authorization URL', () => {
      it('should generate valid Spotify auth URL', () => {
        const url = spotifyAuth.getAuthorizationUrl();
        
        expect(url).toContain('accounts.spotify.com/authorize');
        expect(url).toContain('response_type=code');
        expect(url).toContain('scope=');
        expect(url).toContain('state=');
      });

      it('should include required scopes', () => {
        const url = spotifyAuth.getAuthorizationUrl();
        
        expect(url).toContain('user-follow-modify');
        expect(url).toContain('user-follow-read');
        expect(url).toContain('user-read-private');
        expect(url).toContain('user-read-email');
      });
    });
  });
});