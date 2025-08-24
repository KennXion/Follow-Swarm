#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const db = require('../src/database');
const logger = require('../src/utils/logger');
const encryption = require('../src/utils/encryption');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to database
    await db.connect();
    
    // Create test users
    const users = [
      {
        spotify_id: 'test_user_1',
        email: 'user1@test.com',
        display_name: 'Test User 1',
        profile_image_url: 'https://via.placeholder.com/150',
        country: 'US',
        product: 'premium',
        subscription_tier: 'pro'
      },
      {
        spotify_id: 'test_user_2',
        email: 'user2@test.com',
        display_name: 'Test User 2',
        profile_image_url: 'https://via.placeholder.com/150',
        country: 'UK',
        product: 'free',
        subscription_tier: 'free'
      },
      {
        spotify_id: 'test_user_3',
        email: 'user3@test.com',
        display_name: 'Test User 3',
        profile_image_url: 'https://via.placeholder.com/150',
        country: 'CA',
        product: 'premium',
        subscription_tier: 'premium'
      }
    ];

    const insertedUsers = [];
    
    for (const userData of users) {
      try {
        const result = await db.query(
          `INSERT INTO users (spotify_id, email, display_name, profile_image_url, country, product, subscription_tier)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (spotify_id) DO UPDATE
           SET email = EXCLUDED.email,
               display_name = EXCLUDED.display_name
           RETURNING *`,
          [userData.spotify_id, userData.email, userData.display_name, 
           userData.profile_image_url, userData.country, userData.product, userData.subscription_tier]
        );
        insertedUsers.push(result.rows[0]);
        logger.info(`Created user: ${userData.display_name}`);
      } catch (error) {
        logger.error(`Failed to create user ${userData.display_name}:`, error.message);
      }
    }

    // Create test OAuth tokens (encrypted)
    for (const user of insertedUsers) {
      const tokenData = {
        user_id: user.id,
        access_token: encryption.encrypt('test_access_token_' + user.spotify_id),
        refresh_token: encryption.encrypt('test_refresh_token_' + user.spotify_id),
        expires_at: new Date(Date.now() + 3600000) // 1 hour from now
      };

      try {
        await db.query(
          `INSERT INTO oauth_tokens (user_id, access_token, refresh_token, expires_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE
           SET access_token = EXCLUDED.access_token,
               refresh_token = EXCLUDED.refresh_token,
               expires_at = EXCLUDED.expires_at`,
          [tokenData.user_id, tokenData.access_token, tokenData.refresh_token, tokenData.expires_at]
        );
        logger.info(`Created OAuth tokens for user: ${user.display_name}`);
      } catch (error) {
        logger.error(`Failed to create tokens for ${user.display_name}:`, error.message);
      }
    }

    // Create test follow relationships
    if (insertedUsers.length >= 3) {
      const followRelationships = [
        {
          follower_id: insertedUsers[0].id,
          followed_id: insertedUsers[1].id,
          spotify_followed_id: 'spotify_artist_1',
          status: 'completed'
        },
        {
          follower_id: insertedUsers[0].id,
          followed_id: insertedUsers[2].id,
          spotify_followed_id: 'spotify_artist_2',
          status: 'pending'
        },
        {
          follower_id: insertedUsers[1].id,
          followed_id: insertedUsers[0].id,
          spotify_followed_id: 'spotify_artist_3',
          status: 'completed'
        },
        {
          follower_id: insertedUsers[1].id,
          followed_id: insertedUsers[2].id,
          spotify_followed_id: 'spotify_artist_4',
          status: 'pending'
        }
      ];

      for (const follow of followRelationships) {
        try {
          await db.query(
            `INSERT INTO follows (follower_id, followed_id, spotify_followed_id, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (follower_id, followed_id) DO NOTHING`,
            [follow.follower_id, follow.followed_id, follow.spotify_followed_id, follow.status]
          );
          logger.info(`Created follow relationship`);
        } catch (error) {
          logger.error(`Failed to create follow relationship:`, error.message);
        }
      }
    }

    // Create test analytics events
    const eventTypes = ['login', 'follow_initiated', 'follow_completed', 'page_view'];
    
    for (const user of insertedUsers) {
      for (let i = 0; i < 5; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        try {
          await db.query(
            `INSERT INTO analytics (user_id, event_type, event_category, event_data)
             VALUES ($1, $2, $3, $4)`,
            [user.id, eventType, 'user_action', JSON.stringify({ 
              timestamp: new Date(),
              source: 'seed_script'
            })]
          );
        } catch (error) {
          logger.error(`Failed to create analytics event:`, error.message);
        }
      }
    }
    
    logger.info('Created test analytics events');

    // Create test queue jobs
    for (const user of insertedUsers.slice(0, 2)) {
      try {
        await db.query(
          `INSERT INTO queue_jobs (user_id, job_type, status, payload)
           VALUES ($1, $2, $3, $4)`,
          [user.id, 'follow_batch', 'pending', JSON.stringify({
            batch_size: 50,
            priority: 5
          })]
        );
        logger.info(`Created queue job for user: ${user.display_name}`);
      } catch (error) {
        logger.error(`Failed to create queue job:`, error.message);
      }
    }

    logger.info('Database seeding completed successfully');
    
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;