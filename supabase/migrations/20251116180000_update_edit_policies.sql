-- Update policies to allow users to edit their own content
-- Admins can create/edit/delete events, Staff/Admins can create/edit/delete announcements
-- Users can edit their own events and announcements

-- Drop existing update policies
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;

-- Create new event update policy - Admins can update any event, users can update their own
CREATE POLICY "Users can update own events, admins can update any"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  );

-- Create new announcement update policy - Admins/Staff can update any, users can update their own
CREATE POLICY "Users can update own announcements, admins/staff can update any"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  );

-- Drop existing delete policies
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

-- Create new event delete policy - Admins can delete any event, users can delete their own
CREATE POLICY "Users can delete own events, admins can delete any"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'Admin'
    )
  );

-- Create new announcement delete policy - Admins/Staff can delete any, users can delete their own
CREATE POLICY "Users can delete own announcements, admins/staff can delete any"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  );