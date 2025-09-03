const request = require('supertest');
const express = require('express');
const {
  signupRateLimiter,
  checkHoneypot,
  trackSignupBehavior,
  analyzeSignupBehavior,
  checkSuspiciousIP,
  detectBot,
  verifySpotifyAccount
} = require('../../src/middleware/botProtection');

describe('Bot Protection Middleware', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { signupMetrics: {} };
      next();
    });
  });

  describe('Honeypot Detection', () => {
    it('should block requests with honeypot fields filled', async () => {
      app.post('/test', checkHoneypot, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ 
          username: 'test',
          website: 'bot-filled-this' // Honeypot field
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should allow requests without honeypot fields', async () => {
      app.post('/test', checkHoneypot, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ username: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Signup Behavior Tracking', () => {
    it('should initialize signup metrics', async () => {
      let sessionData;
      app.post('/test', trackSignupBehavior, (req, res) => {
        sessionData = req.session.signupMetrics;
        res.json({ success: true });
      });

      await request(app)
        .post('/test')
        .send({})
        .expect(200);

      expect(sessionData).toHaveProperty('pageLoadTime');
      expect(sessionData).toHaveProperty('interactionCount', 0);
    });

    it('should track interaction metrics', async () => {
      let sessionData;
      app.post('/test', trackSignupBehavior, (req, res) => {
        sessionData = req.session.signupMetrics;
        res.json({ success: true });
      });

      await request(app)
        .post('/test')
        .send({
          _metrics: {
            mouseEvents: 10,
            keyboardEvents: 5,
            focusEvents: 2
          }
        })
        .expect(200);

      expect(sessionData.mouseEvents).toBe(10);
      expect(sessionData.keyboardEvents).toBe(5);
      expect(sessionData.focusEvents).toBe(2);
    });
  });

  describe('Behavior Analysis', () => {
    it('should detect bot-like behavior with no interactions', () => {
      const req = {
        session: {
          signupMetrics: {
            pageLoadTime: Date.now() - 1000, // 1 second ago
            mouseEvents: 0,
            keyboardEvents: 0,
            focusEvents: 0
          }
        }
      };

      const riskScore = analyzeSignupBehavior(req);
      expect(riskScore).toBeGreaterThan(0.5);
    });

    it('should detect human-like behavior with normal interactions', () => {
      const req = {
        session: {
          signupMetrics: {
            pageLoadTime: Date.now() - 10000, // 10 seconds ago
            mouseEvents: 50,
            keyboardEvents: 20,
            focusEvents: 5
          }
        }
      };

      const riskScore = analyzeSignupBehavior(req);
      expect(riskScore).toBeLessThan(0.3);
    });

    it('should detect very fast form submission as bot', () => {
      const req = {
        session: {
          signupMetrics: {
            pageLoadTime: Date.now() - 500, // 0.5 seconds ago
            mouseEvents: 1,
            keyboardEvents: 1,
            focusEvents: 1
          }
        }
      };

      const riskScore = analyzeSignupBehavior(req);
      expect(riskScore).toBeGreaterThan(0.7);
    });
  });

  describe('Spotify Account Verification', () => {
    it('should flag new accounts with no followers as suspicious', async () => {
      const profile = {
        id: 'test_user',
        email: 'test@example.com',
        followers: { total: 0 },
        images: [],
        product: 'free',
        created_at: new Date().toISOString()
      };

      const riskScore = await verifySpotifyAccount(profile);
      expect(riskScore).toBeGreaterThan(0.3);
    });

    it('should accept established accounts with followers', async () => {
      const profile = {
        id: 'established_user',
        email: 'real@example.com',
        followers: { total: 100 },
        images: [{ url: 'profile.jpg' }],
        product: 'premium',
        display_name: 'Real User',
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const riskScore = await verifySpotifyAccount(profile);
      expect(riskScore).toBeLessThan(0.3);
    });

    it('should flag accounts with generic emails', async () => {
      const profile = {
        id: 'suspicious_user',
        email: 'temp123@tempmail.com',
        followers: { total: 5 },
        images: [],
        product: 'free'
      };

      const riskScore = await verifySpotifyAccount(profile);
      expect(riskScore).toBeGreaterThan(0.2);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce signup rate limits', async () => {
      const mockApp = express();
      mockApp.get('/signup', signupRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Make multiple requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(mockApp)
            .get('/signup')
            .set('X-Forwarded-For', '192.168.1.1')
        );
      }

      const responses = await Promise.all(promises);
      const blockedResponses = responses.filter(r => r.status === 429);
      
      // Should block after 3 requests (as per signupRateLimiter config)
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });
});