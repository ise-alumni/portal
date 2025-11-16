-- Fix events tags to use junction table instead of array field

-- Drop existing tags column if it exists (either text[] or uuid[])
ALTER TABLE public.events DROP COLUMN IF EXISTS tags;

-- Create a junction table for many-to-many relationship between events and tags
CREATE TABLE IF NOT EXISTS public.event_tags (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Enable RLS on event_tags table
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_tags table
CREATE POLICY "Anyone can read event tags"
  ON public.event_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert event tags"
  ON public.event_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can update event tags"
  ON public.event_tags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can delete event tags"
  ON public.event_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('Admin', 'Staff')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_tags_event_id ON public.event_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id ON public.event_tags(tag_id);