-- Add image_url columns to events and announcements tables

-- Add image_url column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to announcements table  
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add indexes for image columns
CREATE INDEX IF NOT EXISTS idx_events_image_url ON public.events(image_url);
CREATE INDEX IF NOT EXISTS idx_announcements_image_url ON public.announcements(image_url);