-- Enable pg_trgm extension for trigram matching
-- This must be enabled before creating GIN indexes with gin_trgm_ops
create extension if not exists pg_trgm;