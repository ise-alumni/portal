-- Drop legacy employed boolean column now that professional_status is used
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS employed;

