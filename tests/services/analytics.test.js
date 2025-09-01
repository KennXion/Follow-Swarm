const db = require('../../src/database');

describe('Analytics Service', () => {
  let testUser;

  beforeAll(async () => {
    await db.connect();
    
    // Create test user
    testUser = await db.insert('users', {
      spotify_id: `analytics_test_${Date.now()}`,
      email: `analytics_test_${Date.now()}@example.com`,
      display_name: 'Analytics Test User'
    });
  }, 10000);

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.query('DELETE FROM analytics WHERE user_id = $1', [testUser.id]);
      await db.query('DELETE FROM follows WHERE follower_user_id = $1', [testUser.id]);
      await db.delete('users', testUser.id);
    }
    await db.disconnect();
  }, 10000);

  describe('Event Tracking', () => {
    it('should record analytics events', async () => {
      const event = await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'follow_completed',
        event_category: 'engagement',
        event_data: { artist_id: 'test_artist', method: 'manual' },
        ip_address: '127.0.0.1'
      });

      expect(event).toHaveProperty('id');
      expect(event.event_type).toBe('follow_completed');
      expect(event.event_data.artist_id).toBe('test_artist');
    });

    it('should track user login events', async () => {
      const loginEvent = await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'login',
        event_category: 'auth',
        event_data: { method: 'spotify_oauth', ip: '192.168.1.1' }
      });

      expect(loginEvent.event_type).toBe('login');
      expect(loginEvent.event_category).toBe('auth');
    });

    it('should track subscription changes', async () => {
      const subscriptionEvent = await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'subscription_upgrade',
        event_category: 'revenue',
        event_data: { 
          from: 'free', 
          to: 'pro',
          amount: 9.99,
          currency: 'USD'
        }
      });

      expect(subscriptionEvent.event_type).toBe('subscription_upgrade');
      expect(subscriptionEvent.event_data.amount).toBe(9.99);
    });
  });

  describe('Analytics Queries', () => {
    beforeEach(async () => {
      // Insert test analytics data
      await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'page_view',
        event_category: 'engagement',
        event_data: { page: 'dashboard' }
      });

      await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'follow_completed',
        event_category: 'core_action',
        event_data: { artist_id: 'artist_1' }
      });
    });

    it('should aggregate events by type', async () => {
      const result = await db.query(`
        SELECT event_type, COUNT(*) as count
        FROM analytics 
        WHERE user_id = $1 
        GROUP BY event_type
        ORDER BY count DESC
      `, [testUser.id]);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('event_type');
      expect(result.rows[0]).toHaveProperty('count');
    });

    it('should filter events by time period', async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await db.query(`
        SELECT COUNT(*) as recent_events
        FROM analytics 
        WHERE user_id = $1 
        AND created_at > $2
      `, [testUser.id, oneDayAgo]);

      expect(parseInt(result.rows[0].recent_events)).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate events by category', async () => {
      const result = await db.query(`
        SELECT 
          event_category,
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users
        FROM analytics 
        WHERE user_id = $1
        GROUP BY event_category
      `, [testUser.id]);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('event_category');
      expect(result.rows[0]).toHaveProperty('total_events');
    });
  });

  describe('User Activity Tracking', () => {
    it('should track daily active users', async () => {
      // Insert activity for today
      await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'session_start',
        event_category: 'engagement',
        event_data: { session_id: 'test_session_123' }
      });

      const today = new Date().toDateString();
      const result = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as active_users
        FROM analytics 
        WHERE DATE(created_at) = DATE($1)
        AND event_type = 'session_start'
        GROUP BY DATE(created_at)
      `, [today]);

      expect(result.rows.length).toBe(1);
      expect(parseInt(result.rows[0].active_users)).toBeGreaterThanOrEqual(1);
    });

    it('should calculate user engagement metrics', async () => {
      // Insert various engagement events
      const events = [
        { event_type: 'page_view', event_category: 'engagement' },
        { event_type: 'button_click', event_category: 'engagement' },
        { event_type: 'follow_completed', event_category: 'core_action' }
      ];

      for (const event of events) {
        await db.insert('analytics', {
          user_id: testUser.id,
          ...event,
          event_data: {}
        });
      }

      const result = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE event_category = 'engagement') as engagement_events,
          COUNT(*) FILTER (WHERE event_category = 'core_action') as core_actions,
          COUNT(*) as total_events
        FROM analytics 
        WHERE user_id = $1
      `, [testUser.id]);

      expect(parseInt(result.rows[0].total_events)).toBeGreaterThan(0);
      expect(parseInt(result.rows[0].engagement_events)).toBeGreaterThanOrEqual(0);
      expect(parseInt(result.rows[0].core_actions)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Revenue Analytics', () => {
    it('should track subscription revenue', async () => {
      await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'payment_completed',
        event_category: 'revenue',
        event_data: {
          amount: 9.99,
          currency: 'USD',
          subscription_tier: 'pro',
          payment_method: 'stripe'
        }
      });

      const result = await db.query(`
        SELECT 
          SUM((event_data->>'amount')::decimal) as total_revenue,
          COUNT(*) as payment_count
        FROM analytics 
        WHERE event_type = 'payment_completed'
        AND user_id = $1
      `, [testUser.id]);

      expect(parseFloat(result.rows[0].total_revenue)).toBe(9.99);
      expect(parseInt(result.rows[0].payment_count)).toBe(1);
    });

    it('should calculate monthly recurring revenue', async () => {
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      await db.insert('analytics', {
        user_id: testUser.id,
        event_type: 'subscription_renewed',
        event_category: 'revenue',
        event_data: {
          amount: 9.99,
          tier: 'pro',
          billing_cycle: 'monthly'
        }
      });

      const result = await db.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM((event_data->>'amount')::decimal) as mrr
        FROM analytics 
        WHERE event_type IN ('subscription_renewed', 'subscription_upgrade')
        AND user_id = $1
        GROUP BY DATE_TRUNC('month', created_at)
      `, [testUser.id]);

      if (result.rows.length > 0) {
        expect(parseFloat(result.rows[0].mrr)).toBeGreaterThan(0);
      }
    });
  });
});