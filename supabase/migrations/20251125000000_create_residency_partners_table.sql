-- Create residency_partners table for managing residency partner organizations
CREATE TABLE public.residency_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NULL,
  logo_url TEXT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on residency_partners
ALTER TABLE public.residency_partners ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_residency_partners_name ON public.residency_partners(name);
CREATE INDEX idx_residency_partners_is_active ON public.residency_partners(is_active);

-- RLS policies for residency_partners
-- Admins can do everything
CREATE POLICY "Admins have full access to residency_partners"
ON public.residency_partners
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_type = 'Admin'
    AND profiles.id = auth.uid()
  )
);

-- Staff can read and update residency partners
CREATE POLICY "Staff can read and update residency_partners"
ON public.residency_partners
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_type = 'Staff'
    AND profiles.id = auth.uid()
  )
);

-- Authenticated users can view active residency partners
CREATE POLICY "Users can view active residency_partners"
ON public.residency_partners
FOR SELECT
TO authenticated
USING (
  is_active = true
);
