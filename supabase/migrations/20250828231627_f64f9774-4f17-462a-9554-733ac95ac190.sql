-- Fix RLS policy for coordinators to update condominium data
DROP POLICY IF EXISTS "Coordinators can update their condominium" ON public.condominiums;

CREATE POLICY "Coordinators can update their condominium" 
ON public.condominiums 
FOR UPDATE 
USING (
  id = get_user_condominium(auth.uid()) 
  AND has_role(auth.uid(), 'coordinator'::user_role)
);

-- Enable realtime for condominiums table
ALTER PUBLICATION supabase_realtime ADD TABLE public.condominiums;