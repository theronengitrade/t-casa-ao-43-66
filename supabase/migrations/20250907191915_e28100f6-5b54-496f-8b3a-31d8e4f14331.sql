-- Função para obter ID do condomínio do usuário
CREATE OR REPLACE FUNCTION get_user_condominium(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _cond_id uuid;
BEGIN
  SELECT condominium_id INTO _cond_id
  FROM public.profiles
  WHERE user_id = _user_id;
  
  RETURN _cond_id;
END;
$$;

-- Função para verificar se usuário tem determinado papel
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Habilitar REPLICA IDENTITY FULL para sincronização em tempo real
ALTER TABLE public.visitor_qrcodes REPLICA IDENTITY FULL;
ALTER TABLE public.coordination_staff REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.action_plans REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.residents REPLICA IDENTITY FULL;
ALTER TABLE public.visitors REPLICA IDENTITY FULL;
ALTER TABLE public.occurrences REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;