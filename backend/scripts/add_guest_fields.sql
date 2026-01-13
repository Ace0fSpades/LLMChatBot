-- ============================================
-- Migration: Add guest account support
-- ============================================
-- This script adds fields for temporary guest accounts
-- 
-- Usage:
-- psql -U chat_app_user -d chat_db -f scripts/add_guest_fields.sql
-- ============================================

-- Add is_guest column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_guest'
    ) THEN
        ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_guest added to users table';
    ELSE
        RAISE NOTICE 'Column is_guest already exists';
    END IF;
END
$$;

-- Add expires_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column expires_at added to users table';
    ELSE
        RAISE NOTICE 'Column expires_at already exists';
    END IF;
END
$$;

-- Create index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_users_expires_at ON users(expires_at);

-- Create index on is_guest for efficient guest account queries
CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest);

\echo 'Migration completed successfully!'
