const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/database');
const { generateApiToken } = require('../../src/middleware/auth');

describe('Admin API Endpoints', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    try {
      await db.connect();
      
      // Clean up test users
      await db.query('DELETE FROM users WHERE email LIKE $1', ['%@test.admin%']);
      
      // Create admin user
      adminUser = await db.insert('users', {
        spotify_id: `admin_test_${Date.now()}`,
        email: `admin_${Date.now()}@test.admin`,
        display_name: 'Admin User',
        role: 'admin',
        subscription_tier: 'premium'
      });
      adminToken = generateApiToken(adminUser.id);
      
      // Create regular user
      regularUser = await db.insert('users', {
        spotify_id: `user_test_${Date.now()}`,
        email: `user_${Date.now()}@test.admin`,
        display_name: 'Regular User',
        role: 'user',
        subscription_tier: 'free'
      });
      userToken = generateApiToken(regularUser.id);
    } catch (error) {
      console.log('Admin test setup error:', error.message);
    }
  }, 30000);

  afterAll(async () => {
    try {
      // Clean up
      if (adminUser) await db.delete('users', adminUser.id);
      if (regularUser) await db.delete('users', regularUser.id);
      await db.disconnect();
    } catch (error) {
      console.log('Admin test cleanup error (non-fatal):', error.message);
    }
  }, 30000);

  describe('GET /api/admin/stats', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/stats')
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return platform statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('totalFollows');
      expect(response.body.data).toHaveProperty('revenue');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should require admin role', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return paginated user list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('offset', 0);
    });

    it('should support search filters', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('PUT /api/admin/users/:userId', () => {
    it('should allow admin to update user details', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subscription_tier: 'pro',
          is_active: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription_tier).toBe('pro');
    });

    it('should not allow regular users to update others', async () => {
      await request(app)
        .put(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subscription_tier: 'premium'
        })
        .expect(403);
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    let tempUser;

    beforeEach(async () => {
      tempUser = await db.insert('users', {
        spotify_id: `temp_user_${Date.now()}`,
        email: `temp_${Date.now()}@test.admin`,
        display_name: 'Temp User'
      });
    });

    afterEach(async () => {
      // Clean up if not deleted
      try {
        await db.delete('users', tempUser.id);
      } catch (e) {
        // Already deleted
      }
    });

    it('should allow admin to delete users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify user is deleted
      const deletedUser = await db.findOne('users', { id: tempUser.id });
      expect(deletedUser).toBeNull();
    });

    it('should not allow self-deletion', async () => {
      await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics data for admin', async () => {
      const response = await request(app)
        .get('/api/admin/analytics?period=7d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userGrowth');
      expect(response.body.data).toHaveProperty('followActivity');
      expect(response.body.data).toHaveProperty('revenueMetrics');
    });

    it('should support different time periods', async () => {
      const periods = ['24h', '7d', '30d', '90d'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/admin/analytics?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.period).toBe(period);
      }
    });
  });

  describe('POST /api/admin/system/cache/clear', () => {
    it('should allow admin to clear cache', async () => {
      const response = await request(app)
        .post('/api/admin/system/cache/clear')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared');
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return system logs for admin', async () => {
      const response = await request(app)
        .get('/api/admin/logs?level=error&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/admin/security/suspicious', () => {
    it('should return suspicious activity for admin', async () => {
      const response = await request(app)
        .get('/api/admin/security/suspicious')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suspiciousIPs');
      expect(response.body.data).toHaveProperty('flaggedUsers');
      expect(response.body.data).toHaveProperty('recentAttempts');
    });
  });
});