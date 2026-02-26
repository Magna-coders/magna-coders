-- Migration: Add security features to users table
-- Version: 20240101_1200
-- Description: Adds phone number, 2FA, and security fields to users table

BEGIN;

-- Add phone column for SMS notifications and OTP
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Add 2FA related columns
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN backup_codes TEXT[]; -- Array of backup codes

-- Add security columns
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT chk_users_phone_format
    CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');

ALTER TABLE users ADD CONSTRAINT chk_users_login_attempts
    CHECK (login_attempts >= 0 AND login_attempts <= 10);

-- Create indexes
CREATE INDEX CONCURRENTLY idx_users_phone ON users (phone) WHERE phone IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_two_factor_enabled ON users (two_factor_enabled);
CREATE INDEX CONCURRENTLY idx_users_locked_until ON users (locked_until) WHERE locked_until IS NOT NULL;

-- Update existing users with default values
UPDATE users SET
    two_factor_enabled = false,
    login_attempts = 0
WHERE two_factor_enabled IS NULL;

-- Create system logs table for security events
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system logs
CREATE INDEX CONCURRENTLY idx_system_logs_event_type ON system_logs (event_type);
CREATE INDEX CONCURRENTLY idx_system_logs_user_id ON system_logs (user_id);
CREATE INDEX CONCURRENTLY idx_system_logs_created_at ON system_logs (created_at DESC);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    whatsapp_notifications BOOLEAN DEFAULT false,
    in_app_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    project_updates BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for notification preferences
CREATE INDEX CONCURRENTLY idx_user_notification_preferences_user_id ON user_notification_preferences (user_id);

-- Insert default preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Log migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('20240101_1200', 'Add security features to users table', NOW());

COMMIT;