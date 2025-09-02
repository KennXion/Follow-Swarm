/**
 * SSL/TLS Configuration Module
 * 
 * Provides SSL certificate management and HTTPS configuration
 * for production deployment with proper security headers.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const logger = require('../src/utils/logger');

/**
 * SSL Certificate Configuration
 */
class SSLConfig {
  constructor() {
    this.certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs';
    this.keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private';
    this.caPath = process.env.SSL_CA_PATH || null;
  }

  /**
   * Load SSL certificates from filesystem
   * @returns {Object} SSL options for HTTPS server
   */
  loadCertificates() {
    try {
      const certFile = path.join(this.certPath, 'server.crt');
      const keyFile = path.join(this.keyPath, 'server.key');
      
      // Check if certificate files exist
      if (!fs.existsSync(certFile)) {
        throw new Error(`SSL certificate not found: ${certFile}`);
      }
      
      if (!fs.existsSync(keyFile)) {
        throw new Error(`SSL private key not found: ${keyFile}`);
      }

      const sslOptions = {
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
        // Security options
        secureProtocol: 'TLSv1_2_method',
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':'),
        honorCipherOrder: true
      };

      // Add CA certificate if provided
      if (this.caPath && fs.existsSync(this.caPath)) {
        sslOptions.ca = fs.readFileSync(this.caPath);
      }

      logger.info('SSL certificates loaded successfully');
      return sslOptions;
      
    } catch (error) {
      logger.error('Failed to load SSL certificates:', error);
      throw error;
    }
  }

  /**
   * Create HTTPS server with SSL configuration
   * @param {Express} app - Express application instance
   * @param {number} port - HTTPS port (default: 443)
   * @returns {https.Server} HTTPS server instance
   */
  createHTTPSServer(app, port = 443) {
    const sslOptions = this.loadCertificates();
    
    const server = https.createServer(sslOptions, app);
    
    // Set security headers
    app.use((req, res, next) => {
      // Force HTTPS
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      next();
    });

    return server;
  }

  /**
   * Generate self-signed certificates for development
   * @param {string} domain - Domain name for certificate
   */
  generateSelfSignedCert(domain = 'localhost') {
    const { execSync } = require('child_process');
    
    try {
      // Create SSL directory if it doesn't exist
      const sslDir = path.join(__dirname, '../ssl/dev');
      if (!fs.existsSync(sslDir)) {
        fs.mkdirSync(sslDir, { recursive: true });
      }

      const certPath = path.join(sslDir, 'server.crt');
      const keyPath = path.join(sslDir, 'server.key');

      // Generate private key and certificate
      const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=${domain}"`;
      
      execSync(opensslCmd, { stdio: 'inherit' });
      
      logger.info(`Self-signed certificate generated for ${domain}`);
      logger.info(`Certificate: ${certPath}`);
      logger.info(`Private key: ${keyPath}`);
      
      return { certPath, keyPath };
      
    } catch (error) {
      logger.error('Failed to generate self-signed certificate:', error);
      throw error;
    }
  }
}

/**
 * HTTP to HTTPS redirect middleware
 */
const httpsRedirect = (req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
};

/**
 * Environment-specific SSL configuration
 */
const getSSLConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        enabled: true,
        port: process.env.HTTPS_PORT || 443,
        redirectHttp: true,
        certPath: process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt',
        keyPath: process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key'
      };
      
    case 'staging':
      return {
        enabled: true,
        port: process.env.HTTPS_PORT || 8443,
        redirectHttp: true,
        certPath: process.env.SSL_CERT_PATH || './ssl/staging/server.crt',
        keyPath: process.env.SSL_KEY_PATH || './ssl/staging/server.key'
      };
      
    case 'development':
      return {
        enabled: false, // Optional for development
        port: process.env.HTTPS_PORT || 3443,
        redirectHttp: false,
        certPath: './ssl/dev/server.crt',
        keyPath: './ssl/dev/server.key'
      };
      
    default:
      return {
        enabled: false,
        port: 3001,
        redirectHttp: false
      };
  }
};

module.exports = {
  SSLConfig,
  httpsRedirect,
  getSSLConfig
};
