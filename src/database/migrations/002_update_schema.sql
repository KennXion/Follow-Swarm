-- Update users table to match our implementation
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_follows INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Update oauth_tokens table to match our implementation
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'spotify';
ALTER TABLE oauth_tokens RENAME COLUMN access_token TO encrypted_access_token;
ALTER TABLE oauth_tokens RENAME COLUMN refresh_token TO encrypted_refresh_token;

-- Drop the old follows table and recreate with correct structure
DROP TABLE IF EXISTS follows CASCADE;
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_artist_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  queue_job_id UUID,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Update queue_jobs table to match our implementation
ALTER TABLE queue_jobs RENAME COLUMN scheduled_for TO scheduled_at;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS queue_job_id VARCHAR(255);
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE queue_jobs RENAME COLUMN failed_at TO updated_at;

-- User daily statistics table
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  follows_count INTEGER DEFAULT 0,
  unfollows_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Platform statistics table
CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_follows INTEGER DEFAULT 0,
  total_unfollows INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_user ON follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_target_artist ON follows(target_artist_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date ON user_daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);