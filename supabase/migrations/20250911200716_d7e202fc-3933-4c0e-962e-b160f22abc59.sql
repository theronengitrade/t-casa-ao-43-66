-- Criar função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Criar função para obter condomínio do usuário
CREATE OR REPLACE FUNCTION public.get_user_condominium(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT condominium_id 
  FROM public.profiles 
  WHERE user_id = _user_id
  LIMIT 1
$$;