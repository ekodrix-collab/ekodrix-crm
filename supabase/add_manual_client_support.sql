-- Migration: Allow manual client name for projects and remove requirement for client_id foreign key
-- Run this in Supabase SQL Editor

-- 1. Make client_id column nullable
ALTER TABLE projects ALTER COLUMN client_id DROP NOT NULL;

-- 2. Add client_display_name column for standalone/manual client names
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_display_name VARCHAR(255);
