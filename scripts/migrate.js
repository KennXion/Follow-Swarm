#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const db = require('../src/database');
const logger = require('../src/utils/logger');

async function runMigration() {
  try {
    logger.info('Starting database migration...');
    
    // Connect to database
    await db.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = schema
      .split(/;\s*$|;\s*(?=CREATE|DROP|ALTER|INSERT|UPDATE|DELETE)/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
          logger.debug(`Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Ignore errors for "already exists" cases
          if (error.message.includes('already exists')) {
            logger.debug(`Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            logger.error(`Failed to execute statement: ${error.message}`);
            logger.error(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    logger.info('Database migration completed successfully');
    
    // Add default system settings
    await insertDefaultSettings();
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

async function insertDefaultSettings() {
  const settings = [
    {
      key: 'max_follows_per_hour',
      value: '30',
      description: 'Maximum number of follows allowed per hour per user'
    },
    {
      key: 'max_follows_per_day',
      value: '500',
      description: 'Maximum number of follows allowed per day per user'
    },
    {
      key: 'follow_delay_min_ms',
      value: '120000',
      description: 'Minimum delay between follows in milliseconds (2 minutes)'
    },
    {
      key: 'follow_delay_max_ms',
      value: '240000',
      description: 'Maximum delay between follows in milliseconds (4 minutes)'
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable/disable maintenance mode'
    }
  ];

  for (const setting of settings) {
    try {
      await db.query(
        `INSERT INTO system_settings (key, value, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (key) DO UPDATE 
         SET value = EXCLUDED.value, description = EXCLUDED.description`,
        [setting.key, setting.value, setting.description]
      );
    } catch (error) {
      logger.error(`Failed to insert setting ${setting.key}:`, error.message);
    }
  }
  
  logger.info('Default settings inserted');
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;