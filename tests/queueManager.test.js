const queueManager = require('../src/services/queueManager');
const db = require('../src/database');
const Bull = require('bull');

// Mock Bull queue
jest.mock('bull');

describe('Queue Manager', () => {
  let testUser;
  let mockQueue;

  beforeAll(async () => {
    await db.connect();
    
    // Create test user
    testUser = await db.insert('users', {
      spotify_id: 'queue_test_user',
      email: 'queue@example.com',
      display_name: 'Queue Test User',
      subscription_tier: 'pro'
    });

    // Setup mock queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'mock_job_id' }),
      process: jest.fn(),
      on: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(100),
      getFailedCount: jest.fn().mockResolvedValue(3),
      getDelayedCount: jest.fn().mockResolvedValue(1),
      isPaused: jest.fn().mockResolvedValue(false),
      pause: jest.fn().mockResolvedValue(),
      resume: jest.fn().mockResolvedValue(),
      getJobs: jest.fn().mockResolvedValue([]),
      clean: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue()
    };

    Bull.mockImplementation(() => mockQueue);
  });

  afterAll(async () => {
    if (testUser) {
      await db.delete('users', testUser.id);
    }
    await db.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize queues successfully', async () => {
      await queueManager.initialize();
      
      expect(queueManager.isInitialized).toBe(true);
      expect(queueManager.queues).toHaveProperty('follow');
      expect(queueManager.queues).toHaveProperty('analytics');
      expect(queueManager.queues).toHaveProperty('notification');
    });

    it('should not reinitialize if already initialized', async () => {
      const initialQueues = queueManager.queues;
      await queueManager.initialize();
      
      expect(queueManager.queues).toBe(initialQueues);
    });
  });

  describe('Follow Jobs', () => {
    it('should add single follow job to queue', async () => {
      const job = await queueManager.addFollowJob(
        testUser.id,
        'target_artist_123',
        { priority: 10, delay: 5000 }
      );

      expect(job).toHaveProperty('id', 'mock_job_id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'follow-artist',
        expect.objectContaining({
          userId: testUser.id,
          targetArtistId: 'target_artist_123'
        }),
        expect.objectContaining({
          priority: 10,
          delay: 5000
        })
      );
    });

    it('should add batch follow jobs with delays', async () => {
      const artistIds = ['artist_1', 'artist_2', 'artist_3'];
      
      const jobs = await queueManager.addBatchFollowJobs(
        testUser.id,
        artistIds,
        { priority: 5, delayBetween: 60000 }
      );

      expect(jobs).toHaveLength(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(artistIds.length);
      
      // Verify increasing delays
      const calls = mockQueue.add.mock.calls;
      for (let i = 1; i < calls.length; i++) {
        const prevDelay = calls[i - 1][2].delay;
        const currentDelay = calls[i][2].delay;
        expect(currentDelay).toBeGreaterThan(prevDelay);
      }
    });
  });

  describe('Queue Status', () => {
    it('should get queue status', async () => {
      const status = await queueManager.getQueueStatus('follow');
      
      expect(status).toEqual({
        name: 'follow',
        counts: {
          waiting: 5,
          active: 2,
          completed: 100,
          failed: 3,
          delayed: 1
        },
        isPaused: false,
        workers: expect.any(Number)
      });
    });

    it('should throw error for invalid queue name', async () => {
      await expect(queueManager.getQueueStatus('invalid'))
        .rejects.toThrow('Queue invalid not found');
    });
  });

  describe('User Jobs', () => {
    it('should get user jobs with optional status filter', async () => {
      // Create test jobs
      const job1 = await db.insert('queue_jobs', {
        user_id: testUser.id,
        job_type: 'follow',
        status: 'queued'
      });

      const job2 = await db.insert('queue_jobs', {
        user_id: testUser.id,
        job_type: 'follow',
        status: 'completed'
      });

      // Get all jobs
      const allJobs = await queueManager.getUserJobs(testUser.id);
      expect(allJobs.length).toBeGreaterThanOrEqual(2);

      // Get queued jobs only
      const queuedJobs = await queueManager.getUserJobs(testUser.id, 'queued');
      const queuedIds = queuedJobs.map(j => j.id);
      expect(queuedIds).toContain(job1.id);
      expect(queuedIds).not.toContain(job2.id);

      // Clean up
      await db.delete('queue_jobs', job1.id);
      await db.delete('queue_jobs', job2.id);
    });

    it('should cancel user jobs', async () => {
      // Create test jobs
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        const job = await db.insert('queue_jobs', {
          user_id: testUser.id,
          job_type: 'follow',
          status: 'queued',
          queue_job_id: `bull_job_${i}`
        });
        jobs.push(job);
      }

      // Mock Bull queue jobs
      mockQueue.getJobs.mockResolvedValue(
        jobs.map(j => ({
          id: j.queue_job_id,
          data: { userId: testUser.id },
          remove: jest.fn()
        }))
      );

      const cancelled = await queueManager.cancelUserJobs(testUser.id);
      
      expect(cancelled).toHaveLength(3);
      cancelled.forEach(job => {
        expect(job.status).toBe('cancelled');
      });

      // Clean up
      for (const job of jobs) {
        await db.delete('queue_jobs', job.id);
      }
    });
  });

  describe('Queue Control', () => {
    it('should pause queue', async () => {
      const result = await queueManager.pauseQueue('follow', true);
      
      expect(result).toEqual({ queue: 'follow', paused: true });
      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume queue', async () => {
      const result = await queueManager.pauseQueue('follow', false);
      
      expect(result).toEqual({ queue: 'follow', paused: false });
      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('Analytics', () => {
    it('should track follow analytics', async () => {
      await queueManager.trackFollowAnalytics({
        userId: testUser.id,
        artistId: 'test_artist',
        timestamp: new Date()
      });

      // Check if daily stats were updated
      const stats = await db.query(
        'SELECT * FROM user_daily_stats WHERE user_id = $1 AND date = DATE($2)',
        [testUser.id, new Date()]
      );

      if (stats.rows.length > 0) {
        expect(stats.rows[0].follows_count).toBeGreaterThan(0);
      }
    });

    it('should calculate user metrics', async () => {
      // Create test follows
      const follow1 = await db.insert('follows', {
        follower_user_id: testUser.id,
        target_artist_id: 'artist_1',
        status: 'completed',
        created_at: new Date(),
        completed_at: new Date(Date.now() + 5000)
      });

      const metrics = await queueManager.calculateUserMetrics(testUser.id);
      
      expect(metrics).toHaveProperty('total_follows');
      expect(metrics).toHaveProperty('unique_artists');
      expect(metrics).toHaveProperty('avg_completion_time');
      expect(metrics).toHaveProperty('failure_rate');

      // Clean up
      await db.delete('follows', follow1.id);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old jobs', async () => {
      // Create old job
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
      const oldJob = await db.insert('queue_jobs', {
        user_id: testUser.id,
        job_type: 'follow',
        status: 'completed',
        completed_at: oldDate
      });

      // Create recent job
      const recentJob = await db.insert('queue_jobs', {
        user_id: testUser.id,
        job_type: 'follow',
        status: 'completed',
        completed_at: new Date()
      });

      const deletedCount = await queueManager.cleanupOldJobs(30);
      
      // Old job should be deleted
      const oldJobCheck = await db.findOne('queue_jobs', { id: oldJob.id });
      expect(oldJobCheck).toBeNull();

      // Recent job should remain
      const recentJobCheck = await db.findOne('queue_jobs', { id: recentJob.id });
      expect(recentJobCheck).not.toBeNull();

      // Clean up
      if (recentJobCheck) {
        await db.delete('queue_jobs', recentJob.id);
      }
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await queueManager.shutdown();
      
      expect(queueManager.isInitialized).toBe(false);
      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});