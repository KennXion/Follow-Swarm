const request = require('supertest');
const app = require('../../src/app');
const followEngine = require('../../src/services/followEngine');
const db = require('../../src/database');
const jwt = require('jsonwebtoken');
const config = require('../../config');

// Mock dependencies
jest.mock('../../src/services/followEngine');
jest.mock('../../src/database');

describe('Follow Routes', () => {
  let validToken;
  let testUser;

  beforeAll(() => {
    testUser = {
      id: 'user-123',
      spotify_id: 'spotify-123',
      subscription_tier: 'pro'
    };
    
    validToken = jwt.sign({ userId: testUser.id }, config.security.jwtSecret);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    db.findOne = jest.fn().mockResolvedValue(testUser);
  });

  describe('POST /api/follows/single', () => {
    it('should initiate a single follow', async () => {
      const artistId = 'artist-456';
      
      followEngine.initiateFollow = jest.fn().mockResolvedValue({
        success: true,
        followId: 'follow-789'
      });

      const response = await request(app)
        .post('/api/follows/single')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ artistId })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('followId', 'follow-789');
      expect(followEngine.initiateFollow).toHaveBeenCalledWith(testUser.id, artistId);
    });

    it('should handle missing artistId', async () => {
      const response = await request(app)
        .post('/api/follows/single')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Artist ID is required');
    });

    it('should handle follow failures', async () => {
      followEngine.initiateFollow = jest.fn().mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded'
      });

      const response = await request(app)
        .post('/api/follows/single')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ artistId: 'artist-456' })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Rate limit exceeded');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/follows/single')
        .send({ artistId: 'artist-456' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/follows/batch', () => {
    it('should schedule batch follows', async () => {
      const artistIds = ['artist-1', 'artist-2', 'artist-3'];
      
      followEngine.scheduleBatchFollows = jest.fn().mockResolvedValue([
        { id: 'job-1', status: 'scheduled' },
        { id: 'job-2', status: 'scheduled' },
        { id: 'job-3', status: 'scheduled' }
      ]);

      const response = await request(app)
        .post('/api/follows/batch')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ artistIds })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scheduled', 3);
      expect(followEngine.scheduleBatchFollows).toHaveBeenCalledWith(
        testUser.id, 
        artistIds,
        expect.any(Object)
      );
    });

    it('should validate array input', async () => {
      const response = await request(app)
        .post('/api/follows/batch')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ artistIds: 'not-an-array' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must be an array');
    });

    it('should limit batch size', async () => {
      const tooManyArtists = Array(101).fill('artist-id');
      
      const response = await request(app)
        .post('/api/follows/batch')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ artistIds: tooManyArtists })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Maximum 100 artists');
    });
  });

  describe('GET /api/follows/status', () => {
    it('should return user follow status', async () => {
      followEngine.getUserStats = jest.fn().mockResolvedValue({
        summary: {
          completed: 50,
          pending: 5,
          failed: 2,
          total: 57
        },
        daily: [],
        period: '7d'
      });

      followEngine.checkRateLimits = jest.fn().mockResolvedValue({
        canFollow: true,
        limits: {
          hourly: { limit: 35, used: 10, remaining: 25 },
          daily: { limit: 150, used: 50, remaining: 100 },
          monthly: { limit: 1000, used: 200, remaining: 800 }
        }
      });

      const response = await request(app)
        .get('/api/follows/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('rateLimits');
      expect(response.body.stats.summary.completed).toBe(50);
      expect(response.body.rateLimits.canFollow).toBe(true);
    });

    it('should handle period parameter', async () => {
      followEngine.getUserStats = jest.fn().mockResolvedValue({
        summary: { total: 100 },
        period: '30d'
      });
      
      followEngine.checkRateLimits = jest.fn().mockResolvedValue({
        canFollow: true,
        limits: {}
      });

      await request(app)
        .get('/api/follows/status?period=30d')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(followEngine.getUserStats).toHaveBeenCalledWith(testUser.id, '30d');
    });
  });

  describe('GET /api/follows/history', () => {
    it('should return follow history', async () => {
      const mockFollows = [
        { id: '1', target_artist_id: 'artist-1', status: 'completed', created_at: '2024-01-01' },
        { id: '2', target_artist_id: 'artist-2', status: 'pending', created_at: '2024-01-02' }
      ];

      db.query = jest.fn().mockResolvedValue({ rows: mockFollows });

      const response = await request(app)
        .get('/api/follows/history')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('follows');
      expect(response.body.follows).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM follows'),
        expect.arrayContaining([testUser.id])
      );
    });

    it('should support pagination', async () => {
      db.query = jest.fn().mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/follows/history?page=2&limit=20')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([testUser.id, 20, 20])
      );
    });
  });

  describe('DELETE /api/follows/cancel', () => {
    it('should cancel pending follows', async () => {
      followEngine.cancelPendingFollows = jest.fn().mockResolvedValue([
        { id: 'job-1', status: 'cancelled' },
        { id: 'job-2', status: 'cancelled' }
      ]);

      const response = await request(app)
        .delete('/api/follows/cancel')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('cancelled', 2);
      expect(followEngine.cancelPendingFollows).toHaveBeenCalledWith(testUser.id);
    });

    it('should handle no pending follows', async () => {
      followEngine.cancelPendingFollows = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .delete('/api/follows/cancel')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cancelled', 0);
      expect(response.body).toHaveProperty('message', 'No pending follows to cancel');
    });
  });

  describe('GET /api/follows/suggestions', () => {
    it('should return artist suggestions', async () => {
      followEngine.getTargetArtists = jest.fn().mockResolvedValue([
        { artistId: 'artist-1', name: 'Artist 1', priority: 10 },
        { artistId: 'artist-2', name: 'Artist 2', priority: 8 }
      ]);

      const response = await request(app)
        .get('/api/follows/suggestions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(response.body.suggestions).toHaveLength(2);
      expect(followEngine.getTargetArtists).toHaveBeenCalledWith(testUser.id, 20);
    });

    it('should accept limit parameter', async () => {
      followEngine.getTargetArtists = jest.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/follows/suggestions?limit=50')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(followEngine.getTargetArtists).toHaveBeenCalledWith(testUser.id, 50);
    });
  });
});