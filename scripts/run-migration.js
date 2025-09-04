#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const db = require('../src/database');
const logger = require('../src/utils/logger');

async function runSpecificMigration(migrationFile) {
  try {
    logger.info(`Running migration: ${migrationFile}`);
    
    // Connect to database
    await db.connect();
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', migrationFile);
    const migration = await fs.readFile(migrationPath, 'utf8');
    
    // Split by semicolons but preserve SQL syntax
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      const cleanStatement = statement + ';';
      
      try {
        logger.debug(`Executing: ${cleanStatement.substring(0, 100)}...`);
        await db.query(cleanStatement);
        logger.info(`✓ Executed successfully`);
      } catch (error) {
        if (error.message?.includes('already exists')) {
          logger.warn(`⚠ Skipped (already exists): ${cleanStatement.substring(0, 50)}...`);
        } else {
          logger.error(`✗ Failed: ${error.message}`);
          throw error;
        }
      }
    }
    
    logger.info('Migration completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run specific migration
const migrationFile = process.argv[2] || '003_token_rotation.sql';
runSpecificMigration(migrationFile);