-- Rename residency_partners table to companies
ALTER TABLE public.residency_partners RENAME TO companies;

-- Add is_residency_partner column (default false)
ALTER TABLE public.companies
ADD COLUMN is_residency_partner BOOLEAN NOT NULL DEFAULT false;

-- Update existing residency partners to have is_residency_partner = true
UPDATE public.companies
SET is_residency_partner = true
WHERE is_residency_partner = false; -- This will update all existing records

-- Create index for is_residency_partner
CREATE INDEX idx_companies_is_residency_partner ON public.companies(is_residency_partner);

-- Rename indexes
ALTER INDEX idx_residency_partners_name RENAME TO idx_companies_name;
ALTER INDEX idx_residency_partners_is_active RENAME TO idx_companies_is_active;

-- Update foreign key constraint in residencies table
-- First, drop the old constraint
ALTER TABLE public.residencies
DROP CONSTRAINT IF EXISTS residencies_company_id_fkey;

-- Add new foreign key constraint pointing to companies
ALTER TABLE public.residencies
ADD CONSTRAINT residencies_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Rename the index for company_id in residencies
ALTER INDEX idx_residencies_company_id RENAME TO idx_residencies_company_id; -- Keep same name, just ensure it exists

-- Add company_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for company_id in profiles
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);

-- Drop old RLS policies for residency_partners
DROP POLICY IF EXISTS "Admins have full access to residency_partners" ON public.companies;
DROP POLICY IF EXISTS "Staff can read and update residency_partners" ON public.companies;
DROP POLICY IF EXISTS "Users can view active residency_partners" ON public.companies;

-- Create new RLS policies for companies
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

