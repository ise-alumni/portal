-- Create residencies table for tracking user residency phases and companies
CREATE TABLE public.residencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase TEXT NOT NULL CHECK (phase IN ('R1', 'R2', 'R3', 'R4', 'R5')),
  company_id UUID NOT NULL REFERENCES public.residency_partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: each user can only have one residency per phase
  UNIQUE(phase, user_id)
);

-- Enable RLS on residencies
ALTER TABLE public.residencies ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_residencies_user_id ON public.residencies(user_id);
CREATE INDEX idx_residencies_company_id ON public.residencies(company_id);
CREATE INDEX idx_residencies_phase ON public.residencies(phase);
CREATE INDEX idx_residencies_phase_user ON public.residencies(phase, user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_residencies_updated_at
  BEFORE UPDATE ON public.residencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for residencies

-- Users can view their own residencies
CREATE POLICY "Users can view their own residencies"
ON public.residencies
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own residencies
CREATE POLICY "Users can insert their own residencies"
ON public.residencies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- R5 phase restriction: only users with msc=true can add R5 residencies
    phase != 'R5' OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.msc = true
    )
  )
);

-- Users can update their own residencies
CREATE POLICY "Users can update their own residencies"
ON public.residencies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- R5 phase restriction: only users with msc=true can update R5 residencies
    phase != 'R5' OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.msc = true
    )
  )
);

-- Users can delete their own residencies
CREATE POLICY "Users can delete their own residencies"
ON public.residencies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins have full access to residencies
CREATE POLICY "Admins have full access to residencies"
ON public.residencies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_type = 'Admin'
    AND profiles.id = auth.uid()
  )
);

-- Staff can view all residencies
CREATE POLICY "Staff can view all residencies"
ON public.residencies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_type = 'Staff'
    AND profiles.id = auth.uid()
  )
);