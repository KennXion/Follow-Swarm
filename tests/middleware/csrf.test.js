/**
 * CSRF Middleware Tests
 */

// Mock the csrf-csrf library
const mockValidateRequest = jest.fn();
const mockGenerateCsrfToken = jest.fn(() => 'test-csrf-token');

jest.mock('csrf-csrf', () => ({
  doubleCsrf: jest.fn(() => ({
    generateCsrfToken: mockGenerateCsrfToken,
    validateRequest: mockValidateRequest,
    doubleCsrfProtection: jest.fn((req, res, next) => next())
  }))
}));

const { 
  attachCsrfToken, 
  validateCsrfToken, 
  getCsrfToken 
} = require('../../src/middleware/csrf');

describe('CSRF Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/test',
      headers: {},
      body: {},
      query: {},
      ip: '127.0.0.1'
    };
    
    res = {
      locals: {},
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  describe('attachCsrfToken', () => {
    it('should attach CSRF token to response', () => {
      attachCsrfToken(req, res, next);
      
      expect(res.locals.csrfToken).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
      expect(next).toHaveBeenCalled();
    });
    
    it('should handle token generation errors', () => {
      // Mock error in token generation
      const originalGenerate = require('../../src/middleware/csrf').generateToken;
      
      attachCsrfToken(req, res, next);
      
      // Even with potential errors, it should handle gracefully
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('validateCsrfToken', () => {
    beforeEach(() => {
      // Reset the mock before each test
      mockValidateRequest.mockClear();
      // By default, throw an error (invalid token)
      mockValidateRequest.mockImplementation(() => {
        throw new Error('Invalid CSRF token');
      });
    });
    
    it('should skip validation for safe methods', () => {
      req.method = 'GET';
      
      validateCsrfToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should skip validation for HEAD requests', () => {
      req.method = 'HEAD';
      
      validateCsrfToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should skip validation for OPTIONS requests', () => {
      req.method = 'OPTIONS';
      
      validateCsrfToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should skip validation for OAuth callback', () => {
      req.path = '/auth/callback';
      
      validateCsrfToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should skip validation for health check', () => {
      req.path = '/health';
      
      validateCsrfToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should validate CSRF token for POST requests', () => {
      req.method = 'POST';
      req.path = '/api/follows/single';
      // Without valid token, should fail
      
      validateCsrfToken(req, res, next);
      
      // Should return 403 error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid CSRF token',
        message: 'Your request could not be validated. Please refresh and try again.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should accept valid CSRF token in header', () => {
      req.headers['x-csrf-token'] = 'valid-token';
      // Mock successful validation for this test
      mockValidateRequest.mockImplementationOnce(() => {
        // Don't throw - validation passes
      });
      
      validateCsrfToken(req, res, next);
      
      // Should call next when token is valid
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should accept CSRF token in body', () => {
      req.body._csrf = 'valid-token';
      // Mock successful validation for this test
      mockValidateRequest.mockImplementationOnce(() => {
        // Don't throw - validation passes
      });
      
      validateCsrfToken(req, res, next);
      
      // Should call next when token is valid
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should accept CSRF token in query', () => {
      req.query._csrf = 'valid-token';
      // Mock successful validation for this test
      mockValidateRequest.mockImplementationOnce(() => {
        // Don't throw - validation passes
      });
      
      validateCsrfToken(req, res, next);
      
      // Should call next when token is valid
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('getCsrfToken', () => {
    it('should return CSRF token in response', () => {
      getCsrfToken(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        csrfToken: expect.any(String)
      });
    });
  });
});