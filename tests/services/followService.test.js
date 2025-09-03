const followService = require('../../src/services/followService');
const db = require('../../src/database');
const spotifyApi = require('../../src/services/spotifyApi');
const queueManager = require('../../src/services/queueManager');

// Mock dependencies
jest.mock('../../src/services/spotifyApi');
jest.mock('../../src/services/queueManager');

describe('Follow Service', () => {
  let testUser;
  
  beforeAll(async () => {
    await db.connect();
    
    // Create test user
    testUser = await db.insert('users', {
      spotify_id: `follow_service_test_${Date.now()}`,
      email: `follow_test_${Date.now()}@example.com`,
      display_name: 'Follow Service Test User',
      subscription_tier: 'pro'
    });
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up test data
      await db.query('DELETE FROM follows WHERE follower_user_id = $1', [testUser.id]);
      await db.delete('users', testUser.id);
    }
    await db.disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followArtist', () => {
    it('should successfully follow an artist', async () => {
      const artistId = 'test_artist_123';
      
      // Mock Spotify API response
      spotifyApi.followArtist = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await followService.followArtist(testUser.id, artistId);

      expect(result).toHaveProperty('success', true);
      expect(spotifyApi.followArtist).toHaveBeenCalledWith(
        expect.anything(),
        artistId
      );
    });

    it('should handle follow failure gracefully', async () => {
      const artistId = 'test_artist_456';
      
      spotifyApi.followArtist = jest.fn().mockRejectedValue(
        new Error('Spotify API error')
      );

      const result = await followService.followArtist(testUser.id, artistId);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should record follow in database', async () => {
      const artistId = 'test_artist_789';
      
      spotifyApi.followArtist = jest.fn().mockResolvedValue({
        success: true
      });

      await followService.followArtist(testUser.id, artistId);

      const follow = await db.query(
        'SELECT * FROM follows WHERE follower_user_id = $1 AND target_artist_id = $2',
        [testUser.id, artistId]
      );

      expect(follow.rows.length).toBeGreaterThan(0);
      expect(follow.rows[0].status).toBe('completed');
    });

    it('should respect rate limits', async () => {
      const artistId = 'rate_limit_test';
      
      // Simulate rate limit scenario
      const result = await followService.checkRateLimit(testUser.id);
      
      if (result.limited) {
        expect(result).toHaveProperty('retryAfter');
        expect(result.retryAfter).toBeGreaterThan(0);
      } else {
        expect(result.limited).toBe(false);
      }
    });
  });

  describe('unfollowArtist', () => {
    it('should successfully unfollow an artist', async () => {
      const artistId = 'unfollow_test_123';
      
      // First follow the artist
      await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: artistId,
        status: 'completed'
      });

      spotifyApi.unfollowArtist = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await followService.unfollowArtist(testUser.id, artistId);

      expect(result).toHaveProperty('success', true);
      expect(spotifyApi.unfollowArtist).toHaveBeenCalledWith(
        expect.anything(),
        artistId
      );
    });

    it('should update follow status to unfollowed', async () => {
      const artistId = 'unfollow_test_456';
      
      const follow = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: artistId,
        status: 'completed'
      });

      spotifyApi.unfollowArtist = jest.fn().mockResolvedValue({
        success: true
      });

      await followService.unfollowArtist(testUser.id, artistId);

      const updated = await db.query(
        'SELECT * FROM follows WHERE id = $1',
        [follow.id]
      );

      expect(updated.rows[0].status).toBe('unfollowed');
    });
  });

  describe('getFollowedArtists', () => {
    it('should retrieve list of followed artists', async () => {
      // Insert test follows
      const artistIds = ['artist_1', 'artist_2', 'artist_3'];
      
      for (const artistId of artistIds) {
        await db.insert('follows', {
          follower_user_id: testUser.id,
          target_artist_id: artistId,
          status: 'completed'
        });
      }

      const followed = await followService.getFollowedArtists(testUser.id);

      expect(followed).toBeInstanceOf(Array);
      expect(followed.length).toBeGreaterThanOrEqual(3);
      expect(followed.map(f => f.target_artist_id)).toEqual(
        expect.arrayContaining(artistIds)
      );
    });

    it('should filter by status', async () => {
      const completed = await followService.getFollowedArtists(
        testUser.id, 
        { status: 'completed' }
      );

      const pending = await followService.getFollowedArtists(
        testUser.id,
        { status: 'pending' }
      );

      completed.forEach(follow => {
        expect(follow.status).toBe('completed');
      });

      pending.forEach(follow => {
        expect(follow.status).toBe('pending');
      });
    });

    it('should support pagination', async () => {
      const page1 = await followService.getFollowedArtists(testUser.id, {
        limit: 10,
        offset: 0
      });

      const page2 = await followService.getFollowedArtists(testUser.id, {
        limit: 10,
        offset: 10
      });

      expect(page1).toBeInstanceOf(Array);
      expect(page2).toBeInstanceOf(Array);
      
      // Pages should not have overlapping data
      const page1Ids = page1.map(f => f.id);
      const page2Ids = page2.map(f => f.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('bulkFollow', () => {
    it('should queue multiple follow operations', async () => {
      const artistIds = ['bulk_1', 'bulk_2', 'bulk_3', 'bulk_4', 'bulk_5'];
      
      queueManager.addBatchFollowJobs = jest.fn().mockResolvedValue(
        artistIds.map(id => ({ id: `job_${id}`, status: 'queued' }))
      );

      const result = await followService.bulkFollow(testUser.id, artistIds);

      expect(result).toHaveProperty('queued');
      expect(result.queued).toBe(5);
      expect(queueManager.addBatchFollowJobs).toHaveBeenCalledWith(
        testUser.id,
        artistIds,
        expect.any(Object)
      );
    });

    it('should respect subscription limits', async () => {
      // Set user to free tier
      await db.update('users', testUser.id, {
        subscription_tier: 'free'
      });

      const tooManyArtists = Array(50).fill(0).map((_, i) => `artist_${i}`);
      
      const result = await followService.bulkFollow(testUser.id, tooManyArtists);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('limit');

      // Reset to pro tier
      await db.update('users', testUser.id, {
        subscription_tier: 'pro'
      });
    });

    it('should handle empty artist list', async () => {
      const result = await followService.bulkFollow(testUser.id, []);

      expect(result).toHaveProperty('queued', 0);
    });
  });

  describe('getFollowStatistics', () => {
    it('should calculate follow statistics', async () => {
      // Insert test data
      await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'stat_test_1',
        status: 'completed'
      });

      await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'stat_test_2',
        status: 'pending'
      });

      await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'stat_test_3',
        status: 'failed'
      });

      const stats = await followService.getFollowStatistics(testUser.id);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('failed');
      expect(stats.total).toBeGreaterThanOrEqual(3);
    });

    it('should calculate success rate', async () => {
      const stats = await followService.getFollowStatistics(testUser.id);

      expect(stats).toHaveProperty('successRate');
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });

    it('should include time-based statistics', async () => {
      const stats = await followService.getFollowStatistics(testUser.id, {
        period: '7d'
      });

      expect(stats).toHaveProperty('period', '7d');
      expect(stats).toHaveProperty('dailyAverage');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow follows within rate limit', async () => {
      const result = await followService.checkRateLimit(testUser.id);

      expect(result).toHaveProperty('limited');
      expect(result).toHaveProperty('remaining');
      
      if (!result.limited) {
        expect(result.remaining).toBeGreaterThan(0);
      }
    });

    it('should enforce different limits per subscription tier', async () => {
      // Test free tier
      await db.update('users', testUser.id, { subscription_tier: 'free' });
      const freeLimit = await followService.getRateLimit('free');

      // Test pro tier
      await db.update('users', testUser.id, { subscription_tier: 'pro' });
      const proLimit = await followService.getRateLimit('pro');

      // Test premium tier
      await db.update('users', testUser.id, { subscription_tier: 'premium' });
      const premiumLimit = await followService.getRateLimit('premium');

      expect(premiumLimit.daily).toBeGreaterThan(proLimit.daily);
      expect(proLimit.daily).toBeGreaterThan(freeLimit.daily);
    });
  });

  describe('recommendArtists', () => {
    it('should recommend artists based on user preferences', async () => {
      spotifyApi.getRecommendations = jest.fn().mockResolvedValue({
        artists: [
          { id: 'rec_1', name: 'Artist 1' },
          { id: 'rec_2', name: 'Artist 2' }
        ]
      });

      const recommendations = await followService.recommendArtists(testUser.id);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(spotifyApi.getRecommendations).toHaveBeenCalled();
    });

    it('should exclude already followed artists', async () => {
      // Insert followed artist
      await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'already_followed',
        status: 'completed'
      });

      spotifyApi.getRecommendations = jest.fn().mockResolvedValue({
        artists: [
          { id: 'already_followed', name: 'Already Followed' },
          { id: 'new_artist', name: 'New Artist' }
        ]
      });

      const recommendations = await followService.recommendArtists(testUser.id);

      const ids = recommendations.map(r => r.id);
      expect(ids).not.toContain('already_followed');
    });
  });
});