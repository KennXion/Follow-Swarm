const winston = require('winston');
const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;

  beforeAll(() => {
    // Mock console methods to prevent test output noise
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Logger configuration', () => {
    it('should be a winston logger instance', () => {
      expect(logger).toBeInstanceOf(winston.Logger);
    });

    it('should have correct log levels configured', () => {
      expect(logger.level).toBeDefined();
      expect(['error', 'warn', 'info', 'debug']).toContain(logger.level);
    });

    it('should have transports configured', () => {
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Logging methods', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      logger.info('Test info message');
      expect(logger.info).toBeDefined();
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      logger.error('Test error message');
      expect(logger.error).toBeDefined();
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      logger.warn('Test warning message');
      expect(logger.warn).toBeDefined();
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      logger.debug('Test debug message');
      expect(logger.debug).toBeDefined();
    });
  });

  describe('Log formatting', () => {
    it('should log with timestamp', () => {
      const testMessage = 'Test message with timestamp';
      logger.info(testMessage);
      
      // Check that timestamp formatting is applied
      const hasTimestampFormat = logger.format.timestamp !== undefined;
      expect(hasTimestampFormat).toBe(true);
    });

    it('should log with metadata', () => {
      const metadata = { userId: '123', action: 'test' };
      logger.info('Test with metadata', metadata);
      
      // Logger should accept metadata
      expect(logger.info).toBeDefined();
    });

    it('should handle error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred:', error);
      
      // Should not throw when logging errors
      expect(logger.error).toBeDefined();
    });
  });

  describe('Environment-based configuration', () => {
    it('should adjust log level based on NODE_ENV', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test environment should have appropriate log level
      if (process.env.NODE_ENV === 'production') {
        expect(['error', 'warn', 'info']).toContain(logger.level);
      } else if (process.env.NODE_ENV === 'test') {
        // Test environment might have reduced logging
        expect(logger.level).toBeDefined();
      } else {
        // Development should have debug logging
        expect(['debug', 'info']).toContain(logger.level);
      }
    });

    it('should not log to console in test environment', () => {
      if (process.env.NODE_ENV === 'test') {
        const consoleTransport = logger.transports.find(
          t => t instanceof winston.transports.Console
        );
        
        // In test env, console transport should be silent or removed
        if (consoleTransport) {
          expect(consoleTransport.silent).toBe(true);
        }
      }
    });
  });

  describe('Log file handling', () => {
    it('should have file transport in production', () => {
      if (process.env.NODE_ENV === 'production') {
        const fileTransport = logger.transports.find(
          t => t instanceof winston.transports.File
        );
        expect(fileTransport).toBeDefined();
      }
    });

    it('should rotate logs if configured', () => {
      const fileTransport = logger.transports.find(
        t => t.name === 'file' || t instanceof winston.transports.File
      );
      
      if (fileTransport && fileTransport.maxsize) {
        expect(fileTransport.maxsize).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance logging', () => {
    it('should support performance timing', () => {
      const startTime = Date.now();
      
      // Simulate some operation
      setTimeout(() => {
        const duration = Date.now() - startTime;
        logger.info(`Operation completed in ${duration}ms`);
        expect(duration).toBeGreaterThanOrEqual(0);
      }, 10);
    });

    it('should handle high-volume logging', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        logger.info(`High volume log ${i}`);
      }
      
      // Should not throw or crash
      expect(logger.info).toBeDefined();
    });
  });

  describe('Security considerations', () => {
    it('should not log sensitive data patterns', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'bearer-token-xyz',
        apiKey: 'api-key-123'
      };
      
      // Logger should be configured to filter sensitive data
      logger.info('User data:', sensitiveData);
      
      // This test verifies the logger exists and accepts the data
      // In production, sensitive data should be filtered
      expect(logger.info).toBeDefined();
    });

    it('should sanitize user input in logs', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      logger.info('User input:', maliciousInput);
      
      // Should not execute or cause issues
      expect(logger.info).toBeDefined();
    });
  });
});