-- Add new columns to residents table for the enhanced registration
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS floor text;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS family_members jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS parking_spaces jsonb DEFAULT '[]'::jsonb;

-- Update profiles table to include floor information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS floor text;