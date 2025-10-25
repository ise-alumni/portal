-- Add indexes for search performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles USING gin (company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort ON profiles USING gin (cohort gin_trgm_ops);