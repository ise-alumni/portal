-- Create a stored procedure to serve map data for current and over-time views
CREATE OR REPLACE FUNCTION public.rpc_get_map_data(
  view_mode text,
  p_company text DEFAULT NULL,
  p_cohort integer DEFAULT NULL,
  p_grad_year integer DEFAULT NULL,
  p_degree text DEFAULT NULL
)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  lat double precision,
  lng double precision,
  graduation_year integer,
  cohort integer,
  msc boolean,
  company text,
  city text,
  country text,
  avatar_url text,
  timestamps timestamptz[],
  cities text[],
  countries text[],
  companies text[],
  job_titles text[]
) AS $$
BEGIN
  IF view_mode = 'current' THEN
    RETURN QUERY
    SELECT
      p.id AS profile_id,
      p.full_name,
      p.lat,
      p.lng,
      p.graduation_year,
      p.cohort,
      p.msc,
      p.company,
      p.city,
      p.country,
      p.avatar_url,
      NULL::timestamptz[] AS timestamps,
      NULL::text[] AS cities,
      NULL::text[] AS countries,
      NULL::text[] AS companies,
      NULL::text[] AS job_titles
    FROM public.profiles p
    WHERE
      p.is_public = TRUE
      AND COALESCE(p.removed, FALSE) = FALSE
      AND COALESCE(p.user_type, '') <> 'Staff'
      AND p.lat IS NOT NULL
      AND p.lng IS NOT NULL
      AND (p_company IS NULL OR p.company ILIKE '%' || p_company || '%')
      AND (p_cohort IS NULL OR p.cohort = p_cohort)
      AND (p_grad_year IS NULL OR p.graduation_year = p_grad_year)
      AND (
        p_degree IS NULL
        OR (p_degree = 'msc' AND p.msc IS TRUE)
        OR (p_degree = 'bsc' AND p.msc IS FALSE)
      );
  ELSE
    -- Over-time view: aggregate profile history into movement paths
    RETURN QUERY
    SELECT
      p.id AS profile_id,
      p.full_name,
      p.lat,
      p.lng,
      p.graduation_year,
      p.cohort,
      p.msc,
      p.company,
      p.city,
      p.country,
      p.avatar_url,
      ARRAY_AGG(h.changed_at ORDER BY h.changed_at) AS timestamps,
      ARRAY_AGG(h.city ORDER BY h.changed_at) AS cities,
      ARRAY_AGG(h.country ORDER BY h.changed_at) AS countries,
      ARRAY_AGG(h.company ORDER BY h.changed_at) AS companies,
      ARRAY_AGG(h.job_title ORDER BY h.changed_at) AS job_titles
    FROM public.profiles p
    JOIN public.profiles_history h
      ON h.profile_id = p.id
    WHERE
      p.is_public = TRUE
      AND COALESCE(p.removed, FALSE) = FALSE
      AND COALESCE(p.user_type, '') <> 'Staff'
      AND h.city IS NOT NULL
      AND h.country IS NOT NULL
      AND (p_company IS NULL OR h.company ILIKE '%' || p_company || '%')
      AND (p_cohort IS NULL OR p.cohort = p_cohort)
      AND (p_grad_year IS NULL OR p.graduation_year = p_grad_year)
      AND (
        p_degree IS NULL
        OR (p_degree = 'msc' AND p.msc IS TRUE)
        OR (p_degree = 'bsc' AND p.msc IS FALSE)
      )
    GROUP BY
      p.id,
      p.full_name,
      p.lat,
      p.lng,
      p.graduation_year,
      p.cohort,
      p.msc,
      p.company,
      p.city,
      p.country,
      p.avatar_url
    HAVING
      COUNT(DISTINCT h.city || '|' || h.country) >= 2;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

