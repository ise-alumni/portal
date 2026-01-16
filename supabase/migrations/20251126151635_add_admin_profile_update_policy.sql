-- Add policy for admins to update any profile (including soft delete)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_type = 'Admin' AND removed = false
  )
);

-- Add policy for admins to delete any profile (for soft delete operations)
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_type = 'Admin' AND removed = false
  )
);