-- Add new boolean fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_remote BOOLEAN DEFAULT false,
ADD COLUMN is_entrepreneur BOOLEAN DEFAULT false,
ADD COLUMN is_ise_champion BOOLEAN DEFAULT false,
ADD COLUMN employed BOOLEAN DEFAULT false;