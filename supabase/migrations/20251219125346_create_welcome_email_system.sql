-- Create welcome_email_config table
CREATE TABLE IF NOT EXISTS public.welcome_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT false,
  frequencies JSONB NOT NULL DEFAULT '[1, 3, 7, 14]'::jsonb,
  templates JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create welcome_email_queue table
CREATE TABLE IF NOT EXISTS public.welcome_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('day_1', 'day_3', 'day_7', 'day_14')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one email per type per user
  UNIQUE(user_id, email_type)
);

-- Create welcome_email_log table
CREATE TABLE IF NOT EXISTS public.welcome_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subject TEXT NOT NULL,
  template_used TEXT NOT NULL
);

-- Create email_unsubscribes table
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT CHECK (email_type IS NULL OR email_type IN ('day_1', 'day_3', 'day_7', 'day_14')),
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  
  -- One unsubscribe record per user per email type (null = all emails)
  UNIQUE(user_id, email_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_welcome_email_queue_scheduled_for ON public.welcome_email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_welcome_email_queue_user_id ON public.welcome_email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_welcome_email_queue_status ON public.welcome_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_welcome_email_log_user_id ON public.welcome_email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user_id ON public.email_unsubscribes(user_id);

-- Enable RLS
ALTER TABLE public.welcome_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS policies for welcome_email_config (admin only)
CREATE POLICY "Service role can manage welcome_email_config"
  ON public.welcome_email_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read welcome_email_config"
  ON public.welcome_email_config
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for welcome_email_queue
CREATE POLICY "Service role can manage welcome_email_queue"
  ON public.welcome_email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read their own welcome_email_queue"
  ON public.welcome_email_queue
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for welcome_email_log
CREATE POLICY "Service role can manage welcome_email_log"
  ON public.welcome_email_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read their own welcome_email_log"
  ON public.welcome_email_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for email_unsubscribes
CREATE POLICY "Service role can manage email_unsubscribes"
  ON public.email_unsubscribes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own email_unsubscribes"
  ON public.email_unsubscribes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to get cohort activity
CREATE OR REPLACE FUNCTION public.get_cohort_activity(
  p_cohort INTEGER,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  city TEXT,
  country TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS profile_id,
    p.full_name,
    p.company,
    p.job_title,
    p.city,
    p.country,
    p.updated_at
  FROM public.profiles p
  WHERE
    p.cohort = p_cohort
    AND p.is_public = true
    AND COALESCE(p.removed, false) = false
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to get company activity
CREATE OR REPLACE FUNCTION public.get_company_activity(
  p_company TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  job_title TEXT,
  city TEXT,
  country TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS profile_id,
    p.full_name,
    p.job_title,
    p.city,
    p.country,
    p.updated_at
  FROM public.profiles p
  WHERE
    p.company ILIKE '%' || p_company || '%'
    AND p.is_public = true
    AND COALESCE(p.removed, false) = false
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to get location activity
CREATE OR REPLACE FUNCTION public.get_location_activity(
  p_city TEXT,
  p_country TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS profile_id,
    p.full_name,
    p.company,
    p.job_title,
    p.updated_at
  FROM public.profiles p
  WHERE
    (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
    AND (p_country IS NULL OR p.country ILIKE '%' || p_country || '%')
    AND p.is_public = true
    AND COALESCE(p.removed, false) = false
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to schedule welcome emails
CREATE OR REPLACE FUNCTION public.schedule_welcome_emails(
  p_user_id UUID,
  p_profile_id UUID
)
RETURNS void AS $$
DECLARE
  v_config public.welcome_email_config%ROWTYPE;
  v_frequency INTEGER;
  v_email_type TEXT;
  v_profile_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get configuration
  SELECT * INTO v_config
  FROM public.welcome_email_config
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If no config exists or feature is disabled, return early
  IF v_config.id IS NULL OR NOT v_config.enabled THEN
    RETURN;
  END IF;
  
  -- Get profile creation time
  SELECT created_at INTO v_profile_created_at
  FROM public.profiles
  WHERE id = p_profile_id;
  
  -- Schedule emails for each configured frequency
  FOR v_frequency IN SELECT jsonb_array_elements_text(v_config.frequencies)::INTEGER
  LOOP
    -- Map frequency to email type
    v_email_type := CASE v_frequency
      WHEN 1 THEN 'day_1'
      WHEN 3 THEN 'day_3'
      WHEN 7 THEN 'day_7'
      WHEN 14 THEN 'day_14'
      ELSE NULL
    END;
    
    -- Only schedule if email type is valid
    IF v_email_type IS NOT NULL THEN
      INSERT INTO public.welcome_email_queue (
        user_id,
        profile_id,
        email_type,
        scheduled_for
      ) VALUES (
        p_user_id,
        p_profile_id,
        v_email_type,
        v_profile_created_at + (v_frequency || ' days')::INTERVAL
      )
      ON CONFLICT (user_id, email_type) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user function to schedule welcome emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'Alum'
  )
  RETURNING id INTO v_profile_id;
  
  -- Schedule welcome emails
  PERFORM public.schedule_welcome_emails(NEW.id, v_profile_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed default configuration (only if no config exists)
INSERT INTO public.welcome_email_config (enabled, frequencies, templates)
SELECT
  false,
  '[1, 3, 7, 14]'::jsonb,
  '{
    "day_1": {
      "subject": "Welcome to ISE Alumni Portal!",
      "template": "welcome-day-1"
    },
    "day_3": {
      "subject": "What your cohort is up to",
      "template": "welcome-day-3"
    },
    "day_7": {
      "subject": "What people at your company are up to",
      "template": "welcome-day-7"
    },
    "day_14": {
      "subject": "What people in your area are up to",
      "template": "welcome-day-14"
    }
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.welcome_email_config);

