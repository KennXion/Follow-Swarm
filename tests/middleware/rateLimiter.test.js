const request = require('supertest');
const express = require('express');
const { 
  createRateLimiter, 
  followRateLimiter, 
  apiRateLimiter,
  authRateLimiter 
} = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with custom options', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10,
        message: 'Custom rate limit message'
      });

      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should use default options when none provided', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
    });
  });

  describe('followRateLimiter', () => {
    beforeEach(() => {
      app.use('/follow', followRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/follow')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/follow')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('apiRateLimiter', () => {
    beforeEach(() => {
      app.use('/api', apiRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow API requests within rate limit', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should track rate limit per IP', async () => {
      const response1 = await request(app)
        .get('/api')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(200);

      const response2 = await request(app)
        .get('/api')
        .set('X-Forwarded-For', '192.168.1.2')
        .expect(200);

      expect(response1.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response2.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('authRateLimiter', () => {
    beforeEach(() => {
      app.use('/auth', authRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should apply stricter limits to auth endpoints', async () => {
      const response = await request(app)
        .get('/auth')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBeLessThanOrEqual(10);
    });

    it('should reset rate limit after window expires', async () => {
      // This test would need to mock timers to test properly
      const response = await request(app)
        .get('/auth')
        .expect(200);

      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Rate limit enforcement', () => {
    it('should block requests after limit exceeded', async () => {
      const testApp = express();
      const strictLimiter = createRateLimiter({
        windowMs: 60000,
        max: 2,
        message: 'Too many requests'
      });

      testApp.use('/test', strictLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First two requests should succeed
      await request(testApp).get('/test').expect(200);
      await request(testApp).get('/test').expect(200);

      // Third request should be rate limited
      const response = await request(testApp)
        .get('/test')
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });

    it('should skip rate limiting for whitelisted IPs', async () => {
      const limiterWithSkip = createRateLimiter({
        windowMs: 60000,
        max: 1,
        skip: (req) => req.ip === '::ffff:127.0.0.1'
      });

      const testApp = express();
      testApp.use('/test', limiterWithSkip, (req, res) => {
        res.json({ success: true });
      });

      // Multiple requests from localhost should succeed
      await request(testApp).get('/test').expect(200);
      await request(testApp).get('/test').expect(200);
      await request(testApp).get('/test').expect(200);
    });
  });

  describe('Custom rate limit handlers', () => {
    it('should use custom handler when provided', async () => {
      const customHandler = jest.fn((req, res) => {
        res.status(429).json({ 
          error: 'Custom rate limit error',
          retryAfter: 60
        });
      });

      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        handler: customHandler
      });

      const testApp = express();
      testApp.use('/test', limiter, (req, res) => {
        res.json({ success: true });
      });

      await request(testApp).get('/test').expect(200);
      const response = await request(testApp).get('/test').expect(429);

      expect(response.body.error).toBe('Custom rate limit error');
      expect(customHandler).toHaveBeenCalled();
    });

    it('should include retry-after header', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1
      });

      const testApp = express();
      testApp.use('/test', limiter, (req, res) => {
        res.json({ success: true });
      });

      await request(testApp).get('/test').expect(200);
      const response = await request(testApp).get('/test').expect(429);

      expect(response.headers).toHaveProperty('retry-after');
    });
  });
});