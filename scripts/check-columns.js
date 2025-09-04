#!/usr/bin/env node

const db = require('../src/database');

async function checkColumns() {
  try {
    await db.connect();
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'oauth_tokens' 
      ORDER BY ordinal_position
    `);
    
    console.log('OAuth Tokens Table Columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check for our new columns
    const columns = result.rows.map(r => r.column_name);
    const requiredColumns = ['token_version', 'last_refreshed_at', 'refresh_count', 'previous_refresh_token'];
    
    console.log('\nRequired columns check:');
    requiredColumns.forEach(col => {
      const exists = columns.includes(col);
      console.log(`  - ${col}: ${exists ? '✅' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.disconnect();
  }
}

checkColumns();