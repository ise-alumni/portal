-- Remove email_visible column from profiles table
-- This column is no longer needed as emails are always visible

ALTER TABLE profiles DROP COLUMN IF EXISTS email_visible;

