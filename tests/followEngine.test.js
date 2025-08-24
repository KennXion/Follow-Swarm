const followEngine = require('../src/services/followEngine');
const db = require('../src/database');
const config = require('../config');

describe('Follow Engine', () => {
  let testUser;

  beforeAll(async () => {
    await db.connect();
    
    // Create test user
    testUser = await db.insert('users', {
      spotify_id: 'test_user_123',
      email: 'test@example.com',
      display_name: 'Test User',
      subscription_tier: 'free'
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.delete('users', testUser.id);
    }
    await db.disconnect();
  });

  describe('Rate Limiting', () => {
    it('should check rate limits for free tier', async () => {
      const result = await followEngine.checkRateLimits(testUser.id, 'free');
      
      expect(result).toHaveProperty('canFollow');
      expect(result).toHaveProperty('limits');
      expect(result.limits).toHaveProperty('hourly');
      expect(result.limits).toHaveProperty('daily');
      expect(result.limits).toHaveProperty('monthly');
      
      expect(result.limits.hourly.limit).toBe(config.rateLimits.maxFollowsPerHour);
      expect(result.limits.daily.limit).toBe(config.rateLimits.maxFollowsPerDay);
      expect(result.limits.monthly.limit).toBe(config.subscriptions.free.maxFollowsPerMonth);
    });

    it('should check rate limits for pro tier', async () => {
      const result = await followEngine.checkRateLimits(testUser.id, 'pro');
      
      expect(result.limits.monthly.limit).toBe(config.subscriptions.pro.maxFollowsPerMonth);
    });

    it('should check rate limits for premium tier', async () => {
      const result = await followEngine.checkRateLimits(testUser.id, 'premium');
      
      expect(result.limits.monthly.limit).toBe(Infinity);
      expect(result.limits.monthly.remaining).toBe(Infinity);
    });

    it('should calculate next available slot when rate limited', async () => {
      // Create many follow records to trigger rate limit
      const follows = [];
      for (let i = 0; i < 35; i++) {
        const follow = await db.insert('follows', {
          follower_user_id: testUser.id,
          target_artist_id: `artist_${i}`,
          status: 'completed',
          created_at: new Date()
        });
        follows.push(follow);
      }

      const result = await followEngine.checkRateLimits(testUser.id, 'free');
      
      expect(result.canFollow).toBe(false);
      expect(result.nextAvailableSlot).toBeInstanceOf(Date);
      expect(result.nextAvailableSlot.getTime()).toBeGreaterThan(Date.now());

      // Clean up
      for (const follow of follows) {
        await db.delete('follows', follow.id);
      }
    });
  });

  describe('Follow Count', () => {
    it('should get correct follow count for time period', async () => {
      // Create test follows
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const follow1 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_1',
        status: 'completed',
        created_at: new Date()
      });

      const follow2 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_2',
        status: 'pending',
        created_at: hourAgo
      });

      const count = await followEngine.getFollowCount(testUser.id, dayAgo);
      expect(count).toBe(2);

      // Clean up
      await db.delete('follows', follow1.id);
      await db.delete('follows', follow2.id);
    });

    it('should exclude failed follows from count', async () => {
      const follow1 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_1',
        status: 'completed'
      });

      const follow2 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_2',
        status: 'failed'
      });

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await followEngine.getFollowCount(testUser.id, hourAgo);
      expect(count).toBe(1); // Only completed follow

      // Clean up
      await db.delete('follows', follow1.id);
      await db.delete('follows', follow2.id);
    });
  });

  describe('Target Artists', () => {
    it('should get target artists excluding already followed', async () => {
      // Create some artists (users)
      const artist1 = await db.insert('users', {
        spotify_id: 'artist_spotify_1',
        display_name: 'Artist 1',
        subscription_tier: 'pro'
      });

      const artist2 = await db.insert('users', {
        spotify_id: 'artist_spotify_2',
        display_name: 'Artist 2',
        subscription_tier: 'premium'
      });

      // Create existing follow
      const existingFollow = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: artist1.spotify_id,
        status: 'completed'
      });

      const targets = await followEngine.getTargetArtists(testUser.id, 10);
      
      expect(Array.isArray(targets)).toBe(true);
      
      // Should not include already followed artist
      const targetIds = targets.map(t => t.artistId);
      expect(targetIds).not.toContain(artist1.spotify_id);

      // Clean up
      await db.delete('follows', existingFollow.id);
      await db.delete('users', artist1.id);
      await db.delete('users', artist2.id);
    });

    it('should prioritize artists by total follows', async () => {
      // Create artists with different follow counts
      const artist1 = await db.insert('users', {
        spotify_id: 'popular_artist',
        display_name: 'Popular Artist',
        total_follows: 1000,
        subscription_tier: 'premium'
      });

      const artist2 = await db.insert('users', {
        spotify_id: 'new_artist',
        display_name: 'New Artist',
        total_follows: 10,
        subscription_tier: 'pro'
      });

      const targets = await followEngine.getTargetArtists(testUser.id, 10);
      
      if (targets.length >= 2) {
        // Popular artist should come first
        expect(targets[0].artistId).toBe(artist1.spotify_id);
      }

      // Clean up
      await db.delete('users', artist1.id);
      await db.delete('users', artist2.id);
    });
  });

  describe('Batch Scheduling', () => {
    it('should schedule batch follows with delays', async () => {
      const artistIds = ['artist_1', 'artist_2', 'artist_3'];
      const startTime = new Date();
      
      const jobs = await followEngine.scheduleBatchFollows(
        testUser.id,
        artistIds,
        { priority: 5, delayBetween: 60000 }
      );

      expect(jobs).toHaveLength(3);
      
      // Each job should have increasing scheduled time
      for (let i = 0; i < jobs.length; i++) {
        expect(jobs[i].user_id).toBe(testUser.id);
        expect(jobs[i].job_type).toBe('follow');
        expect(jobs[i].priority).toBe(5);
        expect(jobs[i].status).toBe('scheduled');
        
        if (i > 0) {
          expect(new Date(jobs[i].scheduled_at).getTime()).toBeGreaterThan(
            new Date(jobs[i - 1].scheduled_at).getTime()
          );
        }
      }

      // Clean up
      for (const job of jobs) {
        await db.delete('queue_jobs', job.id);
      }
    });
  });

  describe('Statistics', () => {
    it('should calculate user statistics correctly', async () => {
      // Create test follows
      const follows = [];
      
      // Completed follow
      follows.push(await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_1',
        status: 'completed',
        completed_at: new Date()
      }));

      // Pending follow
      follows.push(await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_2',
        status: 'pending'
      }));

      // Failed follow
      follows.push(await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_3',
        status: 'failed'
      }));

      const stats = await followEngine.getUserStats(testUser.id, '7d');
      
      expect(stats).toHaveProperty('summary');
      expect(stats).toHaveProperty('daily');
      expect(stats).toHaveProperty('period');
      
      expect(stats.summary.completed).toBe(1);
      expect(stats.summary.pending).toBe(1);
      expect(stats.summary.failed).toBe(1);
      expect(stats.summary.total).toBe(3);
      expect(stats.period).toBe('7d');

      // Clean up
      for (const follow of follows) {
        await db.delete('follows', follow.id);
      }
    });

    it('should group statistics by day', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const follow1 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_1',
        status: 'completed',
        created_at: today
      });

      const follow2 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_2',
        status: 'completed',
        created_at: yesterday
      });

      const stats = await followEngine.getUserStats(testUser.id, '7d');
      
      expect(stats.daily).toBeInstanceOf(Array);
      expect(stats.daily.length).toBeGreaterThanOrEqual(1);

      // Clean up
      await db.delete('follows', follow1.id);
      await db.delete('follows', follow2.id);
    });
  });

  describe('Cancel Operations', () => {
    it('should cancel pending follows', async () => {
      // Create pending jobs
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        const job = await db.insert('queue_jobs', {
          user_id: testUser.id,
          job_type: 'follow',
          status: 'scheduled',
          payload: { targetArtistId: `artist_${i}` }
        });
        jobs.push(job);
      }

      const cancelled = await followEngine.cancelPendingFollows(testUser.id);
      
      expect(cancelled).toHaveLength(3);
      cancelled.forEach(job => {
        expect(job.status).toBe('cancelled');
        expect(job.completed_at).not.toBeNull();
      });

      // Verify in database
      for (const job of jobs) {
        const updated = await db.findOne('queue_jobs', { id: job.id });
        expect(updated.status).toBe('cancelled');
      }

      // Clean up
      for (const job of jobs) {
        await db.delete('queue_jobs', job.id);
      }
    });
  });
});