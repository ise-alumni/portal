-- Create announcement_tags junction table for many-to-many relationship between announcements and tags

-- Remove type column from announcements table (will be replaced by tags)
ALTER TABLE public.announcements DROP COLUMN IF EXISTS type;

-- Create a junction table for many-to-many relationship between announcements and tags
CREATE TABLE IF NOT EXISTS public.announcement_tags (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, tag_id)
);

-- Enable RLS on announcement_tags table
ALTER TABLE public.announcement_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcement_tags table
CREATE POLICY "Anyone can read announcement tags"
  ON public.announcement_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert announcement tags"
  ON public.announcement_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can update announcement tags"
  ON public.announcement_tags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can delete announcement tags"
  ON public.announcement_tags
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
CREATE INDEX IF NOT EXISTS idx_announcement_tags_announcement_id ON public.announcement_tags(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_tags_tag_id ON public.announcement_tags(tag_id);

-- Drop old type index since we removed the type column
DROP INDEX IF EXISTS public.idx_announcements_type;