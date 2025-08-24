const { Pool } = require('pg');
const Bull = require('bull');
const config = require('../../config');
const logger = require('../utils/logger');
const db = require('../database');
const spotifyService = require('../auth/spotify');

class FollowEngine {
  constructor() {
    this.spotify = spotifyService;
    this.rateLimiters = new Map();
    this.activeJobs = new Map();
  }

  /**
   * Check if user can perform follow action based on rate limits
   */
  async checkRateLimits(userId, subscriptionTier = 'free') {
    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get follow counts
    const [hourCount, dayCount, monthCount] = await Promise.all([
      this.getFollowCount(userId, hourAgo),
      this.getFollowCount(userId, dayAgo),
      this.getFollowCount(userId, monthAgo)
    ]);

    // Get tier limits
    const tierLimits = config.subscriptions[subscriptionTier];
    const maxMonthly = tierLimits?.maxFollowsPerMonth || config.subscriptions.free.maxFollowsPerMonth;

    const limits = {
      hourly: {
        count: hourCount,
        limit: config.rateLimits.maxFollowsPerHour,
        remaining: Math.max(0, config.rateLimits.maxFollowsPerHour - hourCount)
      },
      daily: {
        count: dayCount,
        limit: config.rateLimits.maxFollowsPerDay,
        remaining: Math.max(0, config.rateLimits.maxFollowsPerDay - dayCount)
      },
      monthly: {
        count: monthCount,
        limit: maxMonthly === -1 ? Infinity : maxMonthly,
        remaining: maxMonthly === -1 ? Infinity : Math.max(0, maxMonthly - monthCount)
      }
    };

    const canFollow = limits.hourly.remaining > 0 && 
                     limits.daily.remaining > 0 && 
                     limits.monthly.remaining > 0;

    return {
      canFollow,
      limits,
      nextAvailableSlot: canFollow ? now : this.calculateNextSlot(limits)
    };
  }

  /**
   * Get follow count for a user since a specific time
   */
  async getFollowCount(userId, since) {
    const query = `
      SELECT COUNT(*) as count
      FROM follows
      WHERE follower_user_id = $1 
        AND created_at >= $2
        AND status IN ('pending', 'completed')
    `;
    
    const result = await db.query(query, [userId, since]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Calculate when the next follow slot is available
   */
  calculateNextSlot(limits) {
    const now = new Date();
    const delays = [];

    if (limits.hourly.remaining === 0) {
      delays.push(60 * 60 * 1000); // 1 hour
    }
    if (limits.daily.remaining === 0) {
      delays.push(24 * 60 * 60 * 1000); // 24 hours
    }
    if (limits.monthly.remaining === 0) {
      delays.push(30 * 24 * 60 * 60 * 1000); // 30 days
    }

    const minDelay = Math.min(...delays);
    return new Date(now.getTime() + minDelay);
  }

  /**
   * Execute follow action for a user
   */
  async followArtist(userId, targetArtistId, jobId = null) {
    try {
      // Get user's Spotify tokens
      const user = await db.findOne('users', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const tokens = await db.findOne('oauth_tokens', { 
        user_id: userId,
        provider: 'spotify' 
      });

      if (!tokens) {
        throw new Error('No Spotify tokens found for user');
      }

      // Decrypt and check token validity
      const decryptedTokens = await this.spotify.decryptTokens(tokens.encrypted_access_token);
      
      // Check if token needs refresh
      if (new Date(tokens.expires_at) <= new Date()) {
        const refreshedTokens = await this.spotify.refreshAccessToken(
          this.spotify.decryptRefreshToken(tokens.encrypted_refresh_token)
        );
        
        // Update tokens in database
        await db.update('oauth_tokens', tokens.id, {
          encrypted_access_token: this.spotify.encryptTokens(refreshedTokens.accessToken),
          expires_at: new Date(Date.now() + refreshedTokens.expiresIn * 1000)
        });
        
        decryptedTokens.accessToken = refreshedTokens.accessToken;
      }

      // Set access token for API call
      this.spotify.spotifyApi.setAccessToken(decryptedTokens.accessToken);

      // Record follow attempt
      const followRecord = await db.insert('follows', {
        follower_user_id: userId,
        target_artist_id: targetArtistId,
        status: 'pending',
        queue_job_id: jobId
      });

      // Execute follow on Spotify
      await this.spotify.spotifyApi.followArtists([targetArtistId]);

      // Update follow record
      await db.update('follows', followRecord.id, {
        status: 'completed',
        completed_at: new Date()
      });

      // Update user stats
      await db.query(`
        UPDATE users 
        SET total_follows = total_follows + 1,
            last_activity = NOW()
        WHERE id = $1
      `, [userId]);

      logger.info(`Follow completed: User ${userId} -> Artist ${targetArtistId}`);
      
      return {
        success: true,
        followId: followRecord.id,
        artistId: targetArtistId
      };

    } catch (error) {
      logger.error('Follow execution failed:', error);
      
      // Record failure
      if (jobId) {
        await db.query(`
          UPDATE follows 
          SET status = 'failed',
              error_message = $1,
              completed_at = NOW()
          WHERE queue_job_id = $2
        `, [error.message, jobId]);
      }

      throw error;
    }
  }

  /**
   * Get artists to follow based on user preferences and history
   */
  async getTargetArtists(userId, limit = 10) {
    // Get user's follow history to avoid duplicates
    const followedArtists = await db.query(`
      SELECT DISTINCT target_artist_id 
      FROM follows 
      WHERE follower_user_id = $1 
        AND status IN ('completed', 'pending')
    `, [userId]);

    const excludeIds = followedArtists.rows.map(r => r.target_artist_id);

    // Get potential artists from other users in the swarm
    const query = `
      SELECT DISTINCT u.spotify_id as artist_id, u.display_name, u.spotify_data
      FROM users u
      WHERE u.id != $1
        AND u.spotify_id NOT IN (${excludeIds.map((_, i) => `$${i + 2}`).join(',') || 'NULL'})
        AND u.is_active = true
        AND u.subscription_tier != 'free'
      ORDER BY u.total_follows DESC
      LIMIT $${excludeIds.length + 2}
    `;

    const params = [userId, ...excludeIds, limit];
    const result = await db.query(query, params);

    return result.rows.map(row => ({
      artistId: row.artist_id,
      name: row.display_name,
      metadata: row.spotify_data
    }));
  }

  /**
   * Schedule batch follow operations
   */
  async scheduleBatchFollows(userId, artistIds, options = {}) {
    const {
      priority = 1,
      delayBetween = config.rateLimits.followDelayMin,
      startTime = new Date()
    } = options;

    const jobs = [];
    let currentDelay = 0;

    for (const artistId of artistIds) {
      const scheduledTime = new Date(startTime.getTime() + currentDelay);
      
      const job = await db.insert('queue_jobs', {
        user_id: userId,
        job_type: 'follow',
        payload: { targetArtistId: artistId },
        priority,
        scheduled_at: scheduledTime,
        status: 'scheduled'
      });

      jobs.push(job);
      
      // Add random delay between follows
      currentDelay += delayBetween + Math.random() * 
        (config.rateLimits.followDelayMax - config.rateLimits.followDelayMin);
    }

    logger.info(`Scheduled ${jobs.length} follow jobs for user ${userId}`);
    return jobs;
  }

  /**
   * Process pending follow jobs
   */
  async processPendingJobs() {
    const query = `
      SELECT * FROM queue_jobs
      WHERE status = 'scheduled'
        AND scheduled_at <= NOW()
        AND attempts < $1
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 10
    `;

    const jobs = await db.query(query, [config.queue.maxJobAttempts]);

    for (const job of jobs.rows) {
      try {
        // Check rate limits before processing
        const user = await db.findOne('users', { id: job.user_id });
        const rateCheck = await this.checkRateLimits(job.user_id, user.subscription_tier);
        
        if (!rateCheck.canFollow) {
          // Reschedule for next available slot
          await db.update('queue_jobs', job.id, {
            scheduled_at: rateCheck.nextAvailableSlot,
            status: 'rescheduled'
          });
          continue;
        }

        // Update job status
        await db.update('queue_jobs', job.id, {
          status: 'processing',
          started_at: new Date()
        });

        // Execute follow
        await this.followArtist(
          job.user_id,
          job.payload.targetArtistId,
          job.id
        );

        // Mark job complete
        await db.update('queue_jobs', job.id, {
          status: 'completed',
          completed_at: new Date()
        });

      } catch (error) {
        logger.error(`Job ${job.id} failed:`, error);
        
        // Update job with failure
        await db.update('queue_jobs', job.id, {
          status: 'failed',
          attempts: job.attempts + 1,
          last_error: error.message,
          completed_at: new Date()
        });

        // Retry if under max attempts
        if (job.attempts + 1 < config.queue.maxJobAttempts) {
          const retryDelay = config.queue.backoffDelay * (job.attempts + 1);
          await db.update('queue_jobs', job.id, {
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + retryDelay)
          });
        }
      }
    }
  }

  /**
   * Get follow statistics for a user
   */
  async getUserStats(userId, period = '7d') {
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      'all': 9999
    };

    const days = periodMap[period] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) as total,
        MIN(created_at) as first_follow,
        MAX(completed_at) as last_follow
      FROM follows
      WHERE follower_user_id = $1
        AND created_at >= $2
    `, [userId, since]);

    const dailyStats = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM follows
      WHERE follower_user_id = $1
        AND created_at >= $2
        AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId, since]);

    return {
      summary: stats.rows[0],
      daily: dailyStats.rows,
      period
    };
  }

  /**
   * Cancel pending follows for a user
   */
  async cancelPendingFollows(userId) {
    const result = await db.query(`
      UPDATE queue_jobs
      SET status = 'cancelled',
          completed_at = NOW()
      WHERE user_id = $1
        AND status IN ('scheduled', 'rescheduled')
      RETURNING *
    `, [userId]);

    logger.info(`Cancelled ${result.rowCount} pending follows for user ${userId}`);
    return result.rows;
  }
}

module.exports = new FollowEngine();