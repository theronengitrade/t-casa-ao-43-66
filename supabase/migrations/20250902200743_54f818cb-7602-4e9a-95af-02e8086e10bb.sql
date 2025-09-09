-- Fix occurrences table to auto-generate occurrence_number using trigger
-- This will remove the NOT NULL constraint and add proper auto-generation

ALTER TABLE public.occurrences 
ALTER COLUMN occurrence_number DROP NOT NULL;

-- Create or replace the trigger to auto-generate occurrence_number
CREATE OR REPLACE FUNCTION public.generate_occurrence_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.occurrence_number IS NULL THEN
    SELECT COALESCE(MAX(occurrence_number), 0) + 1 
    INTO NEW.occurrence_number
    FROM public.occurrences 
    WHERE condominium_id = NEW.condominium_id;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for occurrences
DROP TRIGGER IF EXISTS occurrence_number_trigger ON public.occurrences;
CREATE TRIGGER occurrence_number_trigger
  BEFORE INSERT OR UPDATE ON public.occurrences
  FOR EACH ROW EXECUTE FUNCTION generate_occurrence_number();