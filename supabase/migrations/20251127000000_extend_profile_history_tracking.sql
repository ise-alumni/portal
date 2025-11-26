-- Extend profiles_history table to track additional fields
ALTER TABLE public.profiles_history 
ADD COLUMN professional_status professional_status_enum NULL,
ADD COLUMN is_remote BOOLEAN NULL,
ADD COLUMN is_ise_champion BOOLEAN NULL;

-- Update the trigger function to track new fields
CREATE OR REPLACE FUNCTION public.track_profile_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles_history (
      profile_id, job_title, company, city, country, professional_status, is_remote, is_ise_champion, change_type
    ) VALUES (
      NEW.id, NEW.job_title, NEW.company, NEW.city, NEW.country, NEW.professional_status, NEW.is_remote, NEW.is_ise_champion, 'INSERT'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track if any of the tracked fields changed
    IF NEW.job_title IS DISTINCT FROM OLD.job_title OR
       NEW.company IS DISTINCT FROM OLD.company OR
       NEW.city IS DISTINCT FROM OLD.city OR
       NEW.country IS DISTINCT FROM OLD.country OR
       NEW.professional_status IS DISTINCT FROM OLD.professional_status OR
       NEW.is_remote IS DISTINCT FROM OLD.is_remote OR
       NEW.is_ise_champion IS DISTINCT FROM OLD.is_ise_champion THEN
      INSERT INTO public.profiles_history (
        profile_id, job_title, company, city, country, professional_status, is_remote, is_ise_champion, change_type
      ) VALUES (
        NEW.id, NEW.job_title, NEW.company, NEW.city, NEW.country, NEW.professional_status, NEW.is_remote, NEW.is_ise_champion, 'UPDATE'
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for new fields for better performance
CREATE INDEX idx_profiles_history_professional_status ON public.profiles_history(professional_status);
CREATE INDEX idx_profiles_history_is_remote ON public.profiles_history(is_remote);
CREATE INDEX idx_profiles_history_is_ise_champion ON public.profiles_history(is_ise_champion);