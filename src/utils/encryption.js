/**
 * Encryption Module
 * 
 * Provides comprehensive cryptographic functions for the Follow-Swarm application.
 * Handles token encryption/decryption, password hashing, and secure token generation.
 * Uses AES-256-GCM for symmetric encryption with authentication.
 */

const crypto = require('crypto');
const config = require('../../config');

/**
 * Encryption Class
 * 
 * Implements secure encryption methods using industry-standard algorithms.
 * All sensitive data (tokens, passwords) are encrypted before storage.
 */
class Encryption {
  constructor() {
    // Encryption algorithm: AES-256 with Galois/Counter Mode (authenticated encryption)
    this.algorithm = 'aes-256-gcm';
    // Cryptographic parameters
    this.keyLength = 32;      // 256 bits for AES-256
    this.ivLength = 16;       // Initialization vector size (128 bits)
    this.tagLength = 16;      // Authentication tag size (128 bits)
    this.saltLength = 64;     // Salt size for password hashing (512 bits)
    this.iterations = 100000; // PBKDF2 iterations for key derivation
    
    // Derive master encryption key from configuration password
    this.masterKey = this.deriveKey(config.security.encryptionKey);
  }

  /**
   * Derives an encryption key from a password using PBKDF2
   * @param {string} password - Password to derive key from
   * @returns {Buffer} Derived encryption key
   */
  deriveKey(password) {
    // Fixed salt for application-wide key (ensures consistent key derivation)
    // In a multi-tenant scenario, use per-user salts
    const salt = crypto.createHash('sha256').update('spotify-follow-swarm-salt').digest();
    // PBKDF2: Password-Based Key Derivation Function 2 (resistant to brute-force)
    return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypts text using AES-256-GCM
   * @param {string} text - Plain text to encrypt
   * @returns {string|null} Base64-encoded encrypted data with IV and auth tag, or empty string for empty input
   */
  encrypt(text) {
    if (text === null || text === undefined) return null; // Handle null/undefined
    if (text === '') return ''; // Preserve empty strings without encryption
    
    try {
      // Generate random Initialization Vector for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create AES-256-GCM cipher instance
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      // Perform encryption
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag (ensures data integrity)
      const authTag = cipher.getAuthTag();
      
      // Combine all components for storage
      // Format: [IV (16 bytes)][Auth Tag (16 bytes)][Encrypted Data]
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      // Encode as base64 for safe storage/transmission
      return combined.toString('base64');
    } catch (error) {
      // Log error for debugging (avoid exposing sensitive data)
      // Error details logged but input text is not included for security
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts text encrypted with AES-256-GCM
   * @param {string} encryptedText - Base64-encoded encrypted data
   * @returns {string|null} Decrypted plain text, or empty string for empty input
   * @throws {Error} If decryption fails or auth tag verification fails
   */
  decrypt(encryptedText) {
    if (encryptedText === null || encryptedText === undefined) return null; // Handle null/undefined
    if (encryptedText === '') return ''; // Preserve empty strings without decryption
    
    try {
      // Decode from base64 to binary
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extract components from combined buffer
      const iv = combined.slice(0, this.ivLength);                          // First 16 bytes
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength); // Next 16 bytes
      const encrypted = combined.slice(this.ivLength + this.tagLength);     // Remaining bytes
      
      // Create decipher and set authentication tag for verification
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag); // Will throw if tag doesn't match
      
      // Perform decryption
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Log error for debugging (avoid exposing encrypted data)
      // Error details logged but encrypted text is not included for security
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Password Hashing Methods
   * For secure password storage if needed in future features
   */

  /**
   * Hashes a password using PBKDF2 with a random salt
   * @param {string} password - Password to hash
   * @returns {string} Salt and hash concatenated with colon separator
   */
  hashPassword(password) {
    // Generate random salt for this password
    const salt = crypto.randomBytes(this.saltLength);
    // Hash password with salt using PBKDF2
    const hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
    // Return salt:hash format for storage
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * Verifies a password against its hash
   * @param {string} password - Password to verify
   * @param {string} hashedPassword - Stored hash in salt:hash format
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hashedPassword) {
    // Extract salt and hash from stored format
    const [salt, hash] = hashedPassword.split(':');
    // Hash the provided password with the same salt
    const verifyHash = crypto.pbkdf2Sync(
      password, 
      Buffer.from(salt, 'hex'), 
      this.iterations, 
      this.keyLength, 
      'sha256'
    );
    // Compare hashes (timing-safe comparison would be better in production)
    return hash === verifyHash.toString('hex');
  }

  /**
   * Token Generation Methods
   * For creating secure random tokens and identifiers
   */

  /**
   * Generates a cryptographically secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Hex-encoded random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generates a secure session identifier
   * @returns {string} 64-character hex session ID
   */
  generateSessionId() {
    return this.generateToken(32); // 256 bits of entropy
  }

  /**
   * Data Integrity Methods
   * For checksums and signatures
   */

  /**
   * Creates a SHA-256 hash of data
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Creates an HMAC signature for data
   * Used for webhook verification and API authentication
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key for HMAC
   * @returns {string} Hex-encoded HMAC signature
   */
  sign(data, secret = config.security.jwtSecret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verifies an HMAC signature
   * Uses timing-safe comparison to prevent timing attacks
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} secret - Secret key used for signing
   * @returns {boolean} True if signature is valid
   */
  verifySignature(data, signature, secret = config.security.jwtSecret) {
    const expectedSignature = this.sign(data, secret);
    // Timing-safe comparison prevents timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Export singleton instance for consistent encryption across application
module.exports = new Encryption();