const encryption = require('../../src/utils/encryption');

describe('Encryption Unit Tests', () => {
  describe('Token Encryption', () => {
    it('should encrypt and decrypt tokens correctly', () => {
      const originalToken = 'test_access_token_123';
      
      const encrypted = encryption.encrypt(originalToken);
      expect(encrypted).not.toBe(originalToken);
      expect(encrypted.length).toBeGreaterThan(originalToken.length); // Should be longer when encrypted
      
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('should generate different encrypted values for same token', () => {
      const token = 'test_token';
      const encrypted1 = encryption.encrypt(token);
      const encrypted2 = encryption.encrypt(token);
      
      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      
      // But both should decrypt to same value
      expect(encryption.decrypt(encrypted1)).toEqual(
        encryption.decrypt(encrypted2)
      );
    });

    it('should handle empty tokens', () => {
      const encrypted = encryption.encrypt('');
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters in tokens', () => {
      const specialToken = 'token-with!@#$%^&*()special_chars';
      const encrypted = encryption.encrypt(specialToken);
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe(specialToken);
    });
  });
});