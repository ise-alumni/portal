-- Auto-generate cohort numbers based on graduation year and degree type
-- Cohort 1: 2025 BSc or 2026 MSc
-- Cohort 2: 2026 BSc or 2027 MSc
-- Cohort 3: 2027 BSc or 2028 MSc
-- And so on...

-- Create a function to calculate cohort number
CREATE OR REPLACE FUNCTION calculate_cohort(grad_year INTEGER, is_msc BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
  IF grad_year IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For MSc students, cohort is based on year + 1
  -- For BSc students, cohort is based on year
  -- Cohort 1 starts with 2025 BSc / 2026 MSc
  IF is_msc THEN
    RETURN grad_year - 2025;  -- 2026 MSc = 1, 2027 MSc = 2, etc.
  ELSE
    RETURN grad_year - 2024;  -- 2025 BSc = 1, 2026 BSc = 2, etc.
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing cohort numbers based on graduation_year and msc status
UPDATE profiles 
SET cohort = calculate_cohort(graduation_year, msc)
WHERE graduation_year IS NOT NULL;

-- Create a trigger to auto-calculate cohort when graduation_year or msc changes
CREATE OR REPLACE FUNCTION update_cohort_on_graduation_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cohort = calculate_cohort(NEW.graduation_year, NEW.msc);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profile_cohort ON profiles;

-- Create the trigger
CREATE TRIGGER update_profile_cohort
  BEFORE UPDATE OF graduation_year, msc ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cohort_on_graduation_change();

-- Also update cohort on insert if graduation_year is provided
CREATE TRIGGER update_profile_cohort_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cohort_on_graduation_change();

-- Add comment to explain cohort calculation
COMMENT ON COLUMN profiles.cohort IS 'Auto-calculated cohort number: 1=2025 BSc/2026 MSc, 2=2026 BSc/2027 MSc, etc.';
COMMENT ON FUNCTION calculate_cohort IS 'Calculates cohort number based on graduation year and degree type';