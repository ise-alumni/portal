-- Add professional_status enum type
CREATE TYPE professional_status_enum AS ENUM ('employed', 'entrepreneur', 'open_to_work');

-- Add professional_status column to profiles table
ALTER TABLE profiles 
ADD COLUMN professional_status professional_status_enum NULL;

-- Migrate existing data from boolean fields to enum
UPDATE profiles 
SET professional_status = CASE
  WHEN is_entrepreneur = true THEN 'entrepreneur'::professional_status_enum
  WHEN employed = true THEN 'employed'::professional_status_enum
  ELSE 'open_to_work'::professional_status_enum
END
WHERE professional_status IS NULL;

-- Set a default value for new records
ALTER TABLE profiles 
ALTER COLUMN professional_status SET DEFAULT 'open_to_work'::professional_status_enum;

-- Add index for better search performance
CREATE INDEX idx_profiles_professional_status ON profiles(professional_status);