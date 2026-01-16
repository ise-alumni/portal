-- Add persistent latitude/longitude columns for profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;

