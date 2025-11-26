-- Add removed column to profiles table for soft delete functionality
ALTER TABLE profiles ADD COLUMN removed BOOLEAN DEFAULT FALSE;

-- Add index for better performance on removed queries
CREATE INDEX idx_profiles_removed ON profiles(removed);

-- Add comment
COMMENT ON COLUMN profiles.removed IS 'Soft delete flag - when true, user is excluded from all queries and cannot sign in';