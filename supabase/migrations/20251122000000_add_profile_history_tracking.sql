-- Create profiles_history table for tracking changes over time
CREATE TABLE public.profiles_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT,
  company TEXT,
  city TEXT,
  country TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_type VARCHAR(10) NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE'))
);

-- Enable RLS on profiles_history
ALTER TABLE public.profiles_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_profiles_history_profile_id ON public.profiles_history(profile_id);
CREATE INDEX idx_profiles_history_changed_at ON public.profiles_history(changed_at);

-- Create stored procedure to track profile history
CREATE OR REPLACE FUNCTION public.track_profile_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles_history (
      profile_id, job_title, company, city, country, change_type
    ) VALUES (
      NEW.id, NEW.job_title, NEW.company, NEW.city, NEW.country, 'INSERT'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track if any of the tracked fields changed
    IF NEW.job_title IS DISTINCT FROM OLD.job_title OR
       NEW.company IS DISTINCT FROM OLD.company OR
       NEW.city IS DISTINCT FROM OLD.city OR
       NEW.country IS DISTINCT FROM OLD.country THEN
      INSERT INTO public.profiles_history (
        profile_id, job_title, company, city, country, change_type
      ) VALUES (
        NEW.id, NEW.job_title, NEW.company, NEW.city, NEW.country, 'UPDATE'
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT operations
CREATE TRIGGER track_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_profile_history();

-- Create trigger for UPDATE operations  
CREATE TRIGGER track_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_profile_history();

-- RLS policies for profiles_history
-- Users can view their own profile history
CREATE POLICY "Users can view their own profile history" 
ON public.profiles_history 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profiles_history.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Admins can view all profile history
CREATE POLICY "Admins can view all profile history"
ON public.profiles_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_type = 'Admin'
    AND profiles.id = profiles_history.profile_id
  )
);