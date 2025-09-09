-- Add RLS policies for city_viewer role to access cities, condominiums, and residents

-- Policy for city_viewers to see cities they have access to
CREATE POLICY "City viewers can see their accessible cities" ON public.cities
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::user_role) OR 
  has_city_access(auth.uid(), id)
);

-- Policy for city_viewers to see condominium_cities for their accessible cities
CREATE POLICY "City viewers can see condominium assignments for their cities" ON public.condominium_cities
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::user_role) OR 
  has_city_access(auth.uid(), city_id)
);

-- Policy for city_viewers to see condominiums in their accessible cities
CREATE POLICY "City viewers can see condominiums in their cities" ON public.condominiums
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::user_role) OR 
  id = get_user_condominium(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.condominium_cities cc
    WHERE cc.condominium_id = condominiums.id
    AND has_city_access(auth.uid(), cc.city_id)
  )
);

-- Policy for city_viewers to see residents in condominiums from their accessible cities  
CREATE POLICY "City viewers can see residents in condominiums from their cities" ON public.residents
FOR SELECT 
USING (
  condominium_id = get_user_condominium(auth.uid()) OR
  has_role(auth.uid(), 'coordinator'::user_role) OR
  has_role(auth.uid(), 'super_admin'::user_role) OR
  EXISTS (
    SELECT 1 FROM public.condominium_cities cc
    WHERE cc.condominium_id = residents.condominium_id
    AND has_city_access(auth.uid(), cc.city_id)
  )
);

-- Policy for city_viewers to see profiles of residents in condominiums from their accessible cities
CREATE POLICY "City viewers can see profiles of residents in their cities" ON public.profiles
FOR SELECT 
USING (
  user_id = auth.uid() OR
  condominium_id = get_user_condominium(auth.uid()) OR 
  has_role(auth.uid(), 'super_admin'::user_role) OR
  (role = 'super_admin'::user_role AND has_role(auth.uid(), 'coordinator'::user_role)) OR
  EXISTS (
    SELECT 1 FROM public.residents r
    JOIN public.condominium_cities cc ON r.condominium_id = cc.condominium_id
    WHERE r.profile_id = profiles.id
    AND has_city_access(auth.uid(), cc.city_id)
  )
);