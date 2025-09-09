-- Add foreign keys to space_reservations table
ALTER TABLE public.space_reservations 
ADD CONSTRAINT fk_space_reservations_condominium 
FOREIGN KEY (condominium_id) REFERENCES public.condominiums(id);

ALTER TABLE public.space_reservations 
ADD CONSTRAINT fk_space_reservations_resident 
FOREIGN KEY (resident_id) REFERENCES public.residents(id);

ALTER TABLE public.space_reservations 
ADD CONSTRAINT fk_space_reservations_approved_by 
FOREIGN KEY (approved_by) REFERENCES auth.users(id);