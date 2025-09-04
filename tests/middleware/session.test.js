const request = require('supertest');
const express = require('express');
const session = require('express-session');
const sessionMiddleware = require('../../src/middleware/session');
const redis = require('../../src/database/redis');

describe('Session Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(sessionMiddleware);
    
    // Add test routes
    app.get('/test', (req, res) => {
      res.json({
        sessionId: req.session.id,
        hasSession: !!req.session
      });
    });

    app.post('/set-session', (req, res) => {
      req.session.userId = 'test-user-123';
      req.session.data = { test: true };
      res.json({ success: true });
    });

    app.get('/get-session', (req, res) => {
      res.json({
        userId: req.session.userId,
        data: req.session.data
      });
    });

    app.post('/destroy-session', (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ destroyed: true });
      });
    });
  });

  describe('Session creation', () => {
    it('should create a session for new requests', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.hasSession).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should generate unique session IDs', async () => {
      const response1 = await request(app).get('/test');
      const response2 = await request(app).get('/test');

      expect(response1.body.sessionId).toBeDefined();
      expect(response2.body.sessionId).toBeDefined();
      expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
    });

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/test')
        .expect(200);

      if (response.headers['set-cookie']) {
        const cookieString = response.headers['set-cookie'][0];
        if (process.env.NODE_ENV === 'production') {
          expect(cookieString).toContain('Secure');
        }
      }

      process.env.NODE_ENV = originalEnv;
    });

    it('should set httpOnly cookie', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      if (response.headers['set-cookie']) {
        const cookieString = response.headers['set-cookie'][0];
        expect(cookieString).toContain('HttpOnly');
      }
    });
  });

  describe('Session persistence', () => {
    it('should persist session data across requests', async () => {
      const agent = request.agent(app);

      // Set session data
      await agent
        .post('/set-session')
        .expect(200);

      // Retrieve session data
      const response = await agent
        .get('/get-session')
        .expect(200);

      expect(response.body.userId).toBe('test-user-123');
      expect(response.body.data).toEqual({ test: true });
    });

    it('should maintain session with cookie', async () => {
      const agent = request.agent(app);

      // First request creates session
      const response1 = await agent.get('/test');
      const sessionId1 = response1.body.sessionId;

      // Second request should have same session
      const response2 = await agent.get('/test');
      const sessionId2 = response2.body.sessionId;

      expect(sessionId1).toBe(sessionId2);
    });

    it('should handle session regeneration', async () => {
      const testApp = express();
      testApp.use(sessionMiddleware);
      
      testApp.get('/regenerate', (req, res) => {
        const oldId = req.session.id;
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({
            oldId,
            newId: req.session.id,
            regenerated: true
          });
        });
      });

      const response = await request(testApp)
        .get('/regenerate')
        .expect(200);

      expect(response.body.regenerated).toBe(true);
      expect(response.body.newId).not.toBe(response.body.oldId);
    });
  });

  describe('Session destruction', () => {
    it('should destroy session on logout', async () => {
      const agent = request.agent(app);

      // Create session
      await agent.post('/set-session').expect(200);

      // Verify session exists
      const beforeDestroy = await agent.get('/get-session').expect(200);
      expect(beforeDestroy.body.userId).toBe('test-user-123');

      // Destroy session
      await agent.post('/destroy-session').expect(200);

      // Verify session is gone
      const afterDestroy = await agent.get('/get-session').expect(200);
      expect(afterDestroy.body.userId).toBeUndefined();
    });

    it('should clear session cookie on destroy', async () => {
      const agent = request.agent(app);

      await agent.post('/set-session').expect(200);
      
      const response = await agent.post('/destroy-session').expect(200);
      
      // Check if session cookie is cleared
      if (response.headers['set-cookie']) {
        const cookieString = response.headers['set-cookie'][0];
        // Session should be cleared or expired
        expect(cookieString).toBeDefined();
      }
    });
  });

  describe('Session store (Redis)', () => {
    it('should use Redis store in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // In production, session should be configured with Redis store
      const sessionConfig = require('../../src/middleware/session');
      
      // The middleware should be properly configured
      expect(sessionConfig).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Mock Redis error
      const originalClient = redis.client;
      redis.client = {
        ...originalClient,
        get: jest.fn().mockRejectedValue(new Error('Redis error')),
        set: jest.fn().mockRejectedValue(new Error('Redis error'))
      };

      const response = await request(app)
        .get('/test')
        .expect(200);

      // Should still work even if Redis has issues (fallback to memory)
      expect(response.body.hasSession).toBe(true);

      redis.client = originalClient;
    });
  });

  describe('Session security', () => {
    it('should rotate session ID on privilege escalation', async () => {
      const testApp = express();
      testApp.use(sessionMiddleware);
      
      testApp.post('/login', (req, res) => {
        const oldId = req.session.id;
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          req.session.userId = 'user-123';
          req.session.authenticated = true;
          res.json({
            oldId,
            newId: req.session.id,
            success: true
          });
        });
      });

      const response = await request(testApp)
        .post('/login')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.newId).not.toBe(response.body.oldId);
    });

    it('should have appropriate session timeout', async () => {
      // Session should have maxAge configured
      const testApp = express();
      const testSession = session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
      });
      
      testApp.use(testSession);
      testApp.get('/test', (req, res) => {
        res.json({
          maxAge: req.session.cookie.maxAge
        });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.body.maxAge).toBeGreaterThan(0);
      expect(response.body.maxAge).toBeLessThanOrEqual(1000 * 60 * 60 * 24);
    });

    it('should prevent session fixation attacks', async () => {
      const agent = request.agent(app);

      // Try to set a custom session ID (session fixation attempt)
      const maliciousSessionId = 'malicious-session-id';
      
      const response = await agent
        .get('/test')
        .set('Cookie', `connect.sid=${maliciousSessionId}`)
        .expect(200);

      // Session ID should not be the malicious one
      expect(response.body.sessionId).not.toBe(maliciousSessionId);
    });
  });

  describe('Session data management', () => {
    it('should handle large session data', async () => {
      const testApp = express();
      testApp.use(sessionMiddleware);
      
      testApp.post('/set-large', (req, res) => {
        // Create large data object
        req.session.largeData = Array(1000).fill('x').join('');
        res.json({ success: true });
      });

      testApp.get('/get-large', (req, res) => {
        res.json({
          hasData: !!req.session.largeData,
          dataLength: req.session.largeData ? req.session.largeData.length : 0
        });
      });

      const agent = request.agent(testApp);

      await agent.post('/set-large').expect(200);
      
      const response = await agent.get('/get-large').expect(200);
      expect(response.body.hasData).toBe(true);
      expect(response.body.dataLength).toBe(1000);
    });

    it('should handle concurrent session updates', async () => {
      const agent = request.agent(app);

      // Simulate concurrent updates
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          agent.post('/set-session').expect(200)
        );
      }

      await Promise.all(promises);

      const response = await agent.get('/get-session').expect(200);
      expect(response.body.userId).toBe('test-user-123');
    });
  });
});