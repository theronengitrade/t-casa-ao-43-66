-- Add rejection_reason column to space_reservations table
ALTER TABLE public.space_reservations 
ADD COLUMN rejection_reason TEXT;