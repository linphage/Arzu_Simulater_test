-- Add security fields to users table
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;

-- Update existing users to be active
UPDATE users SET is_active = 1 WHERE is_active IS NULL;
