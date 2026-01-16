-- Convert cohort from TEXT to INTEGER and remove deprecated admin column

-- Convert cohort column from TEXT to INTEGER (will be populated by auto-generation function)
ALTER TABLE profiles ALTER COLUMN cohort TYPE INTEGER USING cohort::INTEGER;

-- Drop policies that depend on admin column (they will be recreated if needed)
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Remove deprecated admin boolean column since we're using user_type instead
ALTER TABLE profiles DROP COLUMN IF EXISTS admin;

-- Recreate the events policies using user_type instead of admin column
CREATE POLICY "Admins can insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
    AND created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  );

-- Add comment to clarify cohort represents graduation year
COMMENT ON COLUMN profiles.cohort IS 'Graduation year as integer (e.g., 2023)';