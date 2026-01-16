-- Add user_type column to profiles table
ALTER TABLE profiles ADD COLUMN user_type TEXT NOT NULL DEFAULT 'Alum'
  CHECK (user_type IN ('Staff', 'Admin', 'Alum'));

-- Backfill existing profiles to Admin
UPDATE profiles SET user_type = 'Admin';