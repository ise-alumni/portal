-- Create announcements table with proper RLS policies

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL CHECK (type IN ('opportunity', 'news', 'lecture', 'program')),
  external_url TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements table
CREATE POLICY "Anyone can read announcements"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type IN ('Admin', 'Staff')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_deadline ON public.announcements(deadline);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();