-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: pg_cron jobs need to be created manually in production
-- For local development, you can schedule the job like this:
-- SELECT cron.schedule(
--   'process-welcome-emails',
--   '0 * * * *', -- Every hour at minute 0
--   $$
--   SELECT net.http_post(
--     url := 'http://127.0.0.1:54321/functions/v1/process-welcome-emails',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- For production, use Supabase's scheduled functions or pg_cron with proper configuration
-- The cron job should call the Edge Function endpoint with service role authentication

