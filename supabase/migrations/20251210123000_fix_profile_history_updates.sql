-- Update profile history trigger to only store changed fields on UPDATE
CREATE OR REPLACE FUNCTION public.track_profile_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles_history (
      profile_id,
      job_title,
      company,
      city,
      country,
      professional_status,
      is_remote,
      is_ise_champion,
      change_type
    ) VALUES (
      NEW.id,
      NEW.job_title,
      NEW.company,
      NEW.city,
      NEW.country,
      NEW.professional_status,
      NEW.is_remote,
      NEW.is_ise_champion,
      'INSERT'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track fields that actually changed; unchanged fields are stored as NULL
    IF NEW.job_title IS DISTINCT FROM OLD.job_title OR
       NEW.company IS DISTINCT FROM OLD.company OR
       NEW.city IS DISTINCT FROM OLD.city OR
       NEW.country IS DISTINCT FROM OLD.country OR
       NEW.professional_status IS DISTINCT FROM OLD.professional_status OR
       NEW.is_remote IS DISTINCT FROM OLD.is_remote OR
       NEW.is_ise_champion IS DISTINCT FROM OLD.is_ise_champion THEN
      INSERT INTO public.profiles_history (
        profile_id,
        job_title,
        company,
        city,
        country,
        professional_status,
        is_remote,
        is_ise_champion,
        change_type
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.job_title IS DISTINCT FROM OLD.job_title THEN NEW.job_title ELSE NULL END,
        CASE WHEN NEW.company IS DISTINCT FROM OLD.company THEN NEW.company ELSE NULL END,
        CASE WHEN NEW.city IS DISTINCT FROM OLD.city THEN NEW.city ELSE NULL END,
        CASE WHEN NEW.country IS DISTINCT FROM OLD.country THEN NEW.country ELSE NULL END,
        CASE WHEN NEW.professional_status IS DISTINCT FROM OLD.professional_status THEN NEW.professional_status ELSE NULL END,
        CASE WHEN NEW.is_remote IS DISTINCT FROM OLD.is_remote THEN NEW.is_remote ELSE NULL END,
        CASE WHEN NEW.is_ise_champion IS DISTINCT FROM OLD.is_ise_champion THEN NEW.is_ise_champion ELSE NULL END,
        'UPDATE'
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
