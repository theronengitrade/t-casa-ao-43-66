-- Add current monthly fee field to condominiums table
ALTER TABLE public.condominiums 
ADD COLUMN current_monthly_fee NUMERIC DEFAULT 50000;

-- Add comment for clarity
COMMENT ON COLUMN public.condominiums.current_monthly_fee IS 'Current monthly fee amount set by coordinator in minor currency units (centavos)';