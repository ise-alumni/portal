-- Grant permissions on public schema to Supabase roles
-- This ensures both current and future database objects are accessible
-- Fixes "permission denied" errors in local development

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing functions/procedures
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Set default privileges for future functions/procedures created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Set default privileges for future sequences created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
