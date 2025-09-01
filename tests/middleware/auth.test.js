const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const {
  isAuthenticated,
  requireSubscription,
  checkSubscription,
  checkRateLimit,
  generateApiToken
} = require('../../src/middleware/auth');
const db = require('../../src/database');

describe('Authentication Middleware', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    try {
      await db.connect();
      
      // Create test user
      testUser = await db.insert('users', {
        spotify_id: `auth_test_${Date.now()}`,
        email: `auth_test_${Date.now()}@example.com`,
        display_name: 'Auth Test User',
        subscription_tier: 'pro'
      });
    } catch (error) {
      console.log('Auth test setup error:', error.message);
    }
  }, 30000);

  afterAll(async () => {
    try {
      if (testUser) await db.delete('users', testUser.id);
      await db.disconnect();
    } catch (error) {
      console.log('Auth test cleanup error (non-fatal):', error.message);
    }
  }, 30000);

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = {};
      next();
    });
  });

  describe('isAuthenticated middleware', () => {
    it('should reject unauthenticated requests', async () => {
      app.get('/protected', isAuthenticated, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/protected')
        .expect(401);
    });

    it('should accept valid JWT tokens', async () => {
      const token = generateApiToken(testUser.id);
      
      app.get('/protected', isAuthenticated, (req, res) => {
        res.json({ 
          success: true, 
          userId: req.user.id 
        });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should accept valid sessions', async () => {
      app.use((req, res, next) => {
        req.session.userId = testUser.id;
        next();
      });
      
      app.get('/protected', isAuthenticated, (req, res) => {
        res.json({ 
          success: true, 
          userId: req.user.id 
        });
      });

      const response = await request(app)
        .get('/protected')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should reject invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      app.get('/protected', isAuthenticated, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });

  describe('requireSubscription middleware', () => {
    it('should allow users with required subscription tier', async () => {
      app.use((req, res, next) => {
        req.user = testUser; // Pro tier user
        next();
      });
      
      app.get('/pro-only', requireSubscription('pro'), (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/pro-only')
        .expect(200);
    });

    it('should block users with insufficient subscription', async () => {
      const freeUser = { ...testUser, subscription_tier: 'free' };
      
      app.use((req, res, next) => {
        req.user = freeUser;
        next();
      });
      
      app.get('/pro-only', requireSubscription('pro'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/pro-only')
        .expect(403);

      expect(response.body.error).toBe('Insufficient subscription');
    });

    it('should handle subscription tier hierarchy', async () => {
      const premiumUser = { ...testUser, subscription_tier: 'premium' };
      
      app.use((req, res, next) => {
        req.user = premiumUser;
        next();
      });
      
      // Premium user should access pro-only content
      app.get('/pro-only', requireSubscription('pro'), (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/pro-only')
        .expect(200);
    });
  });

  describe('checkSubscription middleware', () => {
    it('should allow users with any of the specified tiers', async () => {
      app.use((req, res, next) => {
        req.user = testUser; // Pro tier
        next();
      });
      
      app.get('/multi-tier', checkSubscription(['pro', 'premium']), (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/multi-tier')
        .expect(200);
    });

    it('should block users not in specified tiers', async () => {
      const freeUser = { ...testUser, subscription_tier: 'free' };
      
      app.use((req, res, next) => {
        req.user = freeUser;
        next();
      });
      
      app.get('/multi-tier', checkSubscription(['pro', 'premium']), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/multi-tier')
        .expect(403);

      expect(response.body.requiredTiers).toContain('pro');
      expect(response.body.requiredTiers).toContain('premium');
    });
  });

  describe('generateApiToken', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateApiToken(testUser.id);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, config.security.jwtSecret);
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.type).toBe('api');
    });

    it('should generate tokens that expire', () => {
      const token = generateApiToken(testUser.id);
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('checkRateLimit middleware', () => {
    it('should track rate limits for different actions', async () => {
      const mockUser = { id: testUser.id, subscription_tier: 'free' };
      
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/api-call', checkRateLimit('api_call'), (req, res) => {
        res.json({ success: true });
      });

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api-call');
      }

      // Should still work within limits
      const response = await request(app)
        .get('/api-call')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit-hour');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining-hour');
    });

    it('should skip rate limiting for premium users', async () => {
      const premiumUser = { id: testUser.id, subscription_tier: 'premium' };
      
      app.use((req, res, next) => {
        req.user = premiumUser;
        next();
      });
      
      app.get('/unlimited', checkRateLimit('api_call'), (req, res) => {
        res.json({ success: true });
      });

      // Premium users should not be rate limited
      await request(app)
        .get('/unlimited')
        .expect(200);
    });
  });
});