const Bull = require('bull');
const config = require('../../config');
const logger = require('../utils/logger');
const db = require('../database');
const followEngine = require('./followEngine');

class QueueManager {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.isInitialized = false;
  }

  /**
   * Initialize all queues
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create follow queue
      this.queues.follow = new Bull('follow-queue', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password
        },
        defaultJobOptions: {
          attempts: config.queue.maxJobAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.backoffDelay
          },
          removeOnComplete: true,
          removeOnFail: false
        }
      });

      // Create analytics queue
      this.queues.analytics = new Bull('analytics-queue', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password
        }
      });

      // Create notification queue
      this.queues.notification = new Bull('notification-queue', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password
        }
      });

      // Setup queue event handlers
      this.setupQueueEvents();

      // Setup workers
      await this.setupWorkers();

      this.isInitialized = true;
      logger.info('Queue manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  /**
   * Setup queue event handlers
   */
  setupQueueEvents() {
    // Follow queue events
    this.queues.follow.on('completed', async (job, result) => {
      logger.info(`Follow job ${job.id} completed:`, result);
      await this.updateJobStatus(job.id, 'completed', result);
    });

    this.queues.follow.on('failed', async (job, err) => {
      logger.error(`Follow job ${job.id} failed:`, err);
      await this.updateJobStatus(job.id, 'failed', null, err.message);
    });

    this.queues.follow.on('stalled', (job) => {
      logger.warn(`Follow job ${job.id} stalled`);
    });

    // Analytics queue events
    this.queues.analytics.on('completed', (job) => {
      logger.debug(`Analytics job ${job.id} completed`);
    });

    this.queues.analytics.on('failed', (job, err) => {
      logger.error(`Analytics job ${job.id} failed:`, err);
    });
  }

  /**
   * Setup queue workers
   */
  async setupWorkers() {
    // Follow queue worker
    this.queues.follow.process(config.queue.concurrency, async (job) => {
      const { userId, targetArtistId, jobId } = job.data;
      
      try {
        // Check rate limits
        const user = await db.findOne('users', { id: userId });
        const rateCheck = await followEngine.checkRateLimits(userId, user.subscription_tier);
        
        if (!rateCheck.canFollow) {
          // Delay job until next available slot
          const delay = rateCheck.nextAvailableSlot.getTime() - Date.now();
          await job.moveToDelayed(delay);
          return { delayed: true, nextSlot: rateCheck.nextAvailableSlot };
        }

        // Execute follow
        const result = await followEngine.followArtist(userId, targetArtistId, jobId);
        
        // Track analytics
        await this.queues.analytics.add('track-follow', {
          userId,
          artistId: targetArtistId,
          result,
          timestamp: new Date()
        });

        return result;
      } catch (error) {
        logger.error(`Worker error for job ${job.id}:`, error);
        throw error;
      }
    });

    // Analytics queue worker
    this.queues.analytics.process(async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'track-follow':
          await this.trackFollowAnalytics(data);
          break;
        case 'daily-summary':
          await this.generateDailySummary(data);
          break;
        case 'user-metrics':
          await this.calculateUserMetrics(data);
          break;
        default:
          logger.warn(`Unknown analytics job type: ${type}`);
      }
    });

    // Notification queue worker
    this.queues.notification.process(async (job) => {
      const { type, userId, data } = job.data;
      
      switch (type) {
        case 'follow-complete':
          await this.sendFollowNotification(userId, data);
          break;
        case 'rate-limit-warning':
          await this.sendRateLimitWarning(userId, data);
          break;
        case 'subscription-expiring':
          await this.sendSubscriptionNotification(userId, data);
          break;
        default:
          logger.warn(`Unknown notification type: ${type}`);
      }
    });

    logger.info('Queue workers setup completed');
  }

  /**
   * Add follow job to queue
   */
  async addFollowJob(userId, targetArtistId, options = {}) {
    const {
      priority = 0,
      delay = 0,
      jobId = null
    } = options;

    const job = await this.queues.follow.add(
      'follow-artist',
      {
        userId,
        targetArtistId,
        jobId,
        timestamp: new Date()
      },
      {
        priority,
        delay,
        jobId: jobId || undefined
      }
    );

    // Record in database
    if (!jobId) {
      await db.insert('queue_jobs', {
        user_id: userId,
        job_type: 'follow',
        queue_job_id: job.id,
        payload: { targetArtistId },
        priority,
        scheduled_at: new Date(Date.now() + delay),
        status: 'queued'
      });
    }

    logger.info(`Added follow job ${job.id} for user ${userId}`);
    return job;
  }

  /**
   * Add batch follow jobs
   */
  async addBatchFollowJobs(userId, artistIds, options = {}) {
    const {
      priority = 0,
      delayBetween = config.rateLimits.followDelayMin,
      startDelay = 0
    } = options;

    const jobs = [];
    let currentDelay = startDelay;

    for (const artistId of artistIds) {
      const job = await this.addFollowJob(userId, artistId, {
        priority,
        delay: currentDelay
      });
      
      jobs.push(job);
      
      // Add random variation to delay
      const variation = Math.random() * 
        (config.rateLimits.followDelayMax - config.rateLimits.followDelayMin);
      currentDelay += delayBetween + variation;
    }

    logger.info(`Added ${jobs.length} batch follow jobs for user ${userId}`);
    return jobs;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(queueName = 'follow') {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused()
    ]);

    return {
      name: queueName,
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed
      },
      isPaused: paused,
      workers: config.queue.concurrency
    };
  }

  /**
   * Get user's jobs
   */
  async getUserJobs(userId, status = null) {
    let query = `
      SELECT * FROM queue_jobs
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Cancel user's pending jobs
   */
  async cancelUserJobs(userId) {
    // Cancel in Bull queue
    const jobs = await this.queues.follow.getJobs(['waiting', 'delayed']);
    const userJobs = jobs.filter(job => job.data.userId === userId);
    
    for (const job of userJobs) {
      await job.remove();
    }

    // Update database
    const result = await db.query(`
      UPDATE queue_jobs
      SET status = 'cancelled',
          completed_at = NOW()
      WHERE user_id = $1
        AND status IN ('queued', 'scheduled')
      RETURNING *
    `, [userId]);

    logger.info(`Cancelled ${result.rowCount} jobs for user ${userId}`);
    return result.rows;
  }

  /**
   * Pause/resume queue
   */
  async pauseQueue(queueName = 'follow', pause = true) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    if (pause) {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    } else {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    }

    return { queue: queueName, paused: pause };
  }

  /**
   * Update job status in database
   */
  async updateJobStatus(jobId, status, result = null, error = null) {
    const updateData = {
      status,
      completed_at: new Date()
    };

    if (result) {
      updateData.result = result;
    }

    if (error) {
      updateData.last_error = error;
    }

    await db.query(`
      UPDATE queue_jobs
      SET status = $1,
          completed_at = $2,
          result = $3,
          last_error = $4
      WHERE queue_job_id = $5
    `, [status, updateData.completed_at, result, error, jobId]);
  }

  /**
   * Track follow analytics
   */
  async trackFollowAnalytics(data) {
    const { userId, artistId, timestamp } = data;
    
    // Update user daily stats
    await db.query(`
      INSERT INTO user_daily_stats (user_id, date, follows_count)
      VALUES ($1, DATE($2), 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET follows_count = user_daily_stats.follows_count + 1
    `, [userId, timestamp]);

    // Update global stats
    await db.query(`
      INSERT INTO platform_stats (date, total_follows)
      VALUES (DATE($1), 1)
      ON CONFLICT (date)
      DO UPDATE SET total_follows = platform_stats.total_follows + 1
    `, [timestamp]);
  }

  /**
   * Generate daily summary
   */
  async generateDailySummary(date) {
    const summary = await db.query(`
      SELECT 
        COUNT(DISTINCT follower_user_id) as active_users,
        COUNT(*) as total_follows,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_follows,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_follows
      FROM follows
      WHERE DATE(created_at) = $1
    `, [date]);

    logger.info('Daily summary generated:', summary.rows[0]);
    return summary.rows[0];
  }

  /**
   * Calculate user metrics
   */
  async calculateUserMetrics(userId) {
    const metrics = await db.query(`
      SELECT 
        COUNT(*) as total_follows,
        COUNT(DISTINCT target_artist_id) as unique_artists,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_completion_time,
        COUNT(*) FILTER (WHERE status = 'failed') / NULLIF(COUNT(*), 0)::float as failure_rate
      FROM follows
      WHERE follower_user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
    `, [userId]);

    return metrics.rows[0];
  }

  /**
   * Send follow notification (placeholder)
   */
  async sendFollowNotification(userId, data) {
    // TODO: Implement email/push notification
    logger.info(`Follow notification for user ${userId}:`, data);
  }

  /**
   * Send rate limit warning (placeholder)
   */
  async sendRateLimitWarning(userId, data) {
    // TODO: Implement email/push notification
    logger.info(`Rate limit warning for user ${userId}:`, data);
  }

  /**
   * Send subscription notification (placeholder)
   */
  async sendSubscriptionNotification(userId, data) {
    // TODO: Implement email/push notification
    logger.info(`Subscription notification for user ${userId}:`, data);
  }

  /**
   * Cleanup old jobs
   */
  async cleanupOldJobs(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean Bull queue
    for (const queueName in this.queues) {
      const queue = this.queues[queueName];
      await queue.clean(daysToKeep * 24 * 60 * 60 * 1000);
    }

    // Clean database
    const result = await db.query(`
      DELETE FROM queue_jobs
      WHERE completed_at < $1
        AND status IN ('completed', 'failed', 'cancelled')
    `, [cutoffDate]);

    logger.info(`Cleaned up ${result.rowCount} old jobs`);
    return result.rowCount;
  }

  /**
   * Shutdown queue manager
   */
  async shutdown() {
    logger.info('Shutting down queue manager...');
    
    for (const queueName in this.queues) {
      await this.queues[queueName].close();
    }
    
    this.isInitialized = false;
    logger.info('Queue manager shut down');
  }
}

module.exports = new QueueManager();