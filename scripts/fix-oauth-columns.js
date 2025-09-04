#!/usr/bin/env node

const db = require('../src/database');
const logger = require('../src/utils/logger');

async function addMissingColumns() {
  try {
    await db.connect();
    logger.info('Adding missing columns to oauth_tokens table...');
    
    const alterStatements = [
      'ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1',
      'ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP',
      'ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0',
      'ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS previous_refresh_token TEXT'
    ];
    
    for (const statement of alterStatements) {
      try {
        await db.query(statement);
        logger.info(`✅ Executed: ${statement}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          logger.warn(`Column already exists, skipping`);
        } else {
          throw error;
        }
      }
    }
    
    // Add indexes
    try {
      await db.query('CREATE INDEX IF NOT EXISTS idx_oauth_tokens_version ON oauth_tokens(user_id, token_version)');
      logger.info('✅ Index created/verified');
    } catch (error) {
      logger.warn('Index may already exist');
    }
    
    logger.info('Migration completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

addMissingColumns();