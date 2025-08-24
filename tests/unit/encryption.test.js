const spotifyAuth = require('../../src/auth/spotify');

describe('Encryption Unit Tests', () => {
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

    it('should handle empty tokens', () => {
      const encrypted = spotifyAuth.encryptTokens('');
      const decrypted = spotifyAuth.decryptTokens(encrypted);
      expect(decrypted.accessToken).toBe('');
    });

    it('should handle special characters in tokens', () => {
      const specialToken = 'token-with!@#$%^&*()special_chars';
      const encrypted = spotifyAuth.encryptTokens(specialToken);
      const decrypted = spotifyAuth.decryptTokens(encrypted);
      expect(decrypted.accessToken).toBe(specialToken);
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

    it('should include all required scopes', () => {
      const url = spotifyAuth.getAuthorizationUrl();
      const requiredScopes = [
        'user-follow-modify',
        'user-follow-read',
        'user-read-private',
        'user-read-email',
        'user-library-read'
      ];
      
      requiredScopes.forEach(scope => {
        expect(url).toContain(scope);
      });
    });

    it('should generate unique state values', () => {
      const url1 = spotifyAuth.getAuthorizationUrl();
      const url2 = spotifyAuth.getAuthorizationUrl();
      
      const state1 = url1.match(/state=([^&]+)/)[1];
      const state2 = url2.match(/state=([^&]+)/)[1];
      
      expect(state1).not.toBe(state2);
    });
  });
});