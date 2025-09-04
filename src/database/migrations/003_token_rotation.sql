-- Migration: Add refresh token rotation support
-- Date: 2025-09-03
-- Purpose: Enhance security with refresh token rotation and version tracking

-- Add columns for refresh token rotation
ALTER TABLE oauth_tokens
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_refresh_token TEXT; -- encrypted, for grace period

-- Add index for token version tracking
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_version ON oauth_tokens(user_id, token_version);

-- Add table for token refresh history (for audit trail)
CREATE TABLE IF NOT EXISTS token_refresh_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_token_version INTEGER,
    new_token_version INTEGER,
    refreshed_at TIMESTAMP DEFAULT NOW(),
    refresh_reason VARCHAR(100), -- manual, expiry, rotation, security
    ip_address INET,
    user_agent TEXT
);

-- Create index for history lookup
CREATE INDEX IF NOT EXISTS idx_token_refresh_history_user ON token_refresh_history(user_id, refreshed_at DESC);

-- Add scheduled job types for proactive token refresh
INSERT INTO system_settings (key, value, description)
VALUES 
    ('token_refresh_buffer_minutes', '5', 'Minutes before expiry to trigger automatic refresh'),
    ('token_rotation_enabled', 'true', 'Enable refresh token rotation for enhanced security'),
    ('token_grace_period_minutes', '2', 'Grace period for old refresh tokens after rotation')
ON CONFLICT (key) DO NOTHING;