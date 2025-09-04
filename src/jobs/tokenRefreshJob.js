/**
 * Token Refresh Job
 * 
 * Scheduled job that proactively refreshes Spotify access tokens
 * before they expire to ensure uninterrupted follow operations.
 * Critical for maintaining continuous authentication in the follow exchange system.
 * 
 * @author Claude
 * @since 2025-09-03
 */

const cron = require('node-cron');
const spotifyAuth = require('../auth/spotify');
const logger = require('../utils/logger');
const config = require('../../config');

class TokenRefreshJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
    // Default: run every 5 minutes
    this.schedule = config.jobs?.tokenRefreshSchedule || '*/5 * * * *';
    this.bufferMinutes = config.jobs?.tokenRefreshBufferMinutes || 5;
  }

  /**
   * Start the token refresh job
   */
  start() {
    if (this.job) {
      logger.warn('Token refresh job is already running');
      return;
    }

    logger.info(`Starting token refresh job with schedule: ${this.schedule}`);
    
    this.job = cron.schedule(this.schedule, async () => {
      if (this.isRunning) {
        logger.debug('Token refresh job already in progress, skipping...');
        return;
      }

      await this.run();
    });

    // Run once immediately on startup
    this.run();
  }

  /**
   * Stop the token refresh job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Token refresh job stopped');
    }
  }

  /**
   * Execute token refresh logic
   */
  async run() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('Running token refresh job...');
      
      // Refresh tokens that are about to expire
      const refreshedUsers = await spotifyAuth.refreshExpiringTokens(this.bufferMinutes);
      
      const duration = Date.now() - startTime;
      
      if (refreshedUsers.length > 0) {
        logger.info(`Token refresh job completed in ${duration}ms. Refreshed ${refreshedUsers.length} tokens`);
      } else {
        logger.debug(`Token refresh job completed in ${duration}ms. No tokens needed refresh`);
      }
      
      return refreshedUsers;
    } catch (error) {
      logger.error('Token refresh job failed:', error);
      
      // Track failed job for monitoring
      const duration = Date.now() - startTime;
      logger.error(`Token refresh job failed after ${duration}ms`);
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.job,
      schedule: this.schedule,
      bufferMinutes: this.bufferMinutes
    };
  }

  /**
   * Update job configuration
   */
  updateConfig(newConfig) {
    const needsRestart = this.schedule !== newConfig.schedule;
    
    this.schedule = newConfig.schedule || this.schedule;
    this.bufferMinutes = newConfig.bufferMinutes || this.bufferMinutes;
    
    if (needsRestart && this.job) {
      logger.info('Restarting token refresh job with new schedule');
      this.stop();
      this.start();
    }
  }
}

// Create singleton instance
const tokenRefreshJob = new TokenRefreshJob();

module.exports = tokenRefreshJob;