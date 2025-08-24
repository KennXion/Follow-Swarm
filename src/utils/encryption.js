const crypto = require('crypto');
const config = require('../../config');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltLength = 64;
    this.iterations = 100000;
    
    // Derive key from config
    this.masterKey = this.deriveKey(config.security.encryptionKey);
  }

  deriveKey(password) {
    // Use a fixed salt for consistent key derivation (in production, you might want to store this)
    const salt = crypto.createHash('sha256').update('spotify-follow-swarm-salt').digest();
    return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
  }

  encrypt(text) {
    if (!text) return null;
    
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted text
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash passwords (for any future password features)
  hashPassword(password) {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(
      password, 
      Buffer.from(salt, 'hex'), 
      this.iterations, 
      this.keyLength, 
      'sha256'
    );
    return hash === verifyHash.toString('hex');
  }

  // Generate secure random tokens
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure session ID
  generateSessionId() {
    return this.generateToken(32);
  }

  // Create a hash of data (for checksums, etc.)
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Sign data (for webhook verification, etc.)
  sign(data, secret = config.security.jwtSecret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifySignature(data, signature, secret = config.security.jwtSecret) {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new Encryption();