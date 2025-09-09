-- Update RLS policy to allow coordinators to see super admin profiles
DROP POLICY IF EXISTS "Users can see profiles in their condominium" ON public.profiles;

CREATE POLICY "Users can see profiles in their condominium or super admin"
ON public.profiles
FOR SELECT
USING (
  (condominium_id = get_user_condominium(auth.uid())) 
  OR (user_id = auth.uid())
  OR (role = 'super_admin' AND has_role(auth.uid(), 'coordinator'))
);