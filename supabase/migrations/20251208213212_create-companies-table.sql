-- Create companies table as the main source of truth for all companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  website TEXT NULL,
  logo_url TEXT NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_companies_name ON public.companies(name);

-- RLS policies for companies
-- Anyone can read companies
CREATE POLICY "Anyone can read companies"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can create companies (for profile creation)
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins and Staff can update companies
CREATE POLICY "Admins and Staff can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type IN ('Admin', 'Staff')
  )
);

-- Admins and Staff can delete companies
CREATE POLICY "Admins and Staff can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type IN ('Admin', 'Staff')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add company_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for company_id in profiles
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);

-- Add company_id to residency_partners table
ALTER TABLE public.residency_partners
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for company_id in residency_partners
CREATE INDEX idx_residency_partners_company_id ON public.residency_partners(company_id);

-- Optional: Migrate existing residency_partners to companies
-- This creates company records for existing residency partners
INSERT INTO public.companies (name, website, logo_url, description)
SELECT name, website, logo_url, description
FROM public.residency_partners
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE companies.name = residency_partners.name
)
ON CONFLICT (name) DO NOTHING;

-- Link residency_partners to their corresponding companies
UPDATE public.residency_partners rp
SET company_id = c.id
FROM public.companies c
WHERE rp.name = c.name
AND rp.company_id IS NULL;

