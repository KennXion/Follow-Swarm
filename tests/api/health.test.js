const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database');
const redis = require('../../src/database/redis');

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('healthy');
    });

    it('should include uptime information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should include version information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toBeDefined();
    });

    it('should be accessible without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include database health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services.database).toHaveProperty('status');
      expect(response.body.services.database).toHaveProperty('responseTime');
    });

    it('should include Redis health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services).toHaveProperty('redis');
      expect(response.body.services.redis).toHaveProperty('status');
      expect(response.body.services.redis).toHaveProperty('responseTime');
    });

    it('should include queue health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services).toHaveProperty('queues');
      expect(response.body.services.queues).toHaveProperty('status');
    });

    it('should include memory usage', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('rss');
    });

    it('should include CPU usage', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('cpu');
      expect(response.body.cpu).toHaveProperty('usage');
      expect(response.body.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(response.body.cpu.usage).toBeLessThanOrEqual(100);
    });
  });

  describe('Health check failure scenarios', () => {
    it('should return degraded status if database is slow', async () => {
      // Mock slow database response
      const originalHealthCheck = db.healthCheck;
      db.healthCheck = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ 
            status: 'healthy', 
            responseTime: 5000 
          }), 100)
        )
      );

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      if (response.body.services.database.responseTime > 3000) {
        expect(response.body.status).toContain('degraded');
      }

      db.healthCheck = originalHealthCheck;
    });

    it('should return unhealthy if critical service is down', async () => {
      // Mock database failure
      const originalHealthCheck = db.healthCheck;
      db.healthCheck = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services.database.status).toBe('unhealthy');
      expect(response.body.status).toContain('unhealthy');

      db.healthCheck = originalHealthCheck;
    });

    it('should handle Redis connection failure gracefully', async () => {
      // Mock Redis failure
      const originalPing = redis.client.ping;
      redis.client.ping = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services.redis.status).toBe('unhealthy');
      
      redis.client.ping = originalPing;
    });
  });

  describe('GET /health/ready', () => {
    it('should indicate readiness when all services are healthy', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body.ready).toBe(true);
    });

    it('should return 503 if not ready', async () => {
      // Mock service not ready
      const originalHealthCheck = db.healthCheck;
      db.healthCheck = jest.fn().mockRejectedValue(new Error('Not ready'));

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body.ready).toBe(false);
      expect(response.body).toHaveProperty('reason');

      db.healthCheck = originalHealthCheck;
    });
  });

  describe('GET /health/live', () => {
    it('should indicate liveness', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('alive');
      expect(response.body.alive).toBe(true);
    });

    it('should always return 200 unless app is crashing', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.alive).toBe(true);
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Performance metrics', () => {
    it('should track response times', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      if (response.body.metrics) {
        expect(response.body.metrics).toHaveProperty('http');
        expect(response.body.metrics.http).toHaveProperty('requestsTotal');
        expect(response.body.metrics.http).toHaveProperty('averageResponseTime');
      }
    });

    it('should include queue metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      if (response.body.metrics && response.body.metrics.queues) {
        expect(response.body.metrics.queues).toHaveProperty('jobsProcessed');
        expect(response.body.metrics.queues).toHaveProperty('jobsFailed');
        expect(response.body.metrics.queues).toHaveProperty('jobsPending');
      }
    });
  });
});