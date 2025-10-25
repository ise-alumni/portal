-- Add cohort column to profiles table
ALTER TABLE profiles ADD COLUMN cohort TEXT;

-- Backfill existing profiles with cohort based on graduation_year
UPDATE profiles SET cohort = graduation_year::TEXT WHERE graduation_year IS NOT NULL;

-- For MSc profiles, prefix with 'MSc '
UPDATE profiles SET cohort = 'MSc ' || cohort WHERE msc = true AND cohort IS NOT NULL;