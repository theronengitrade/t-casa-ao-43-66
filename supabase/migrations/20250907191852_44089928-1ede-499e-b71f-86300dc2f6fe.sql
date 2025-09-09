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
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_role user_role;
BEGIN
  SELECT role INTO _user_role
  FROM public.profiles
  WHERE user_id = _user_id;
  
  RETURN _user_role = _role;
END;
$$;

-- Habilitar RLS na tabela visitor_qrcodes (se ainda não estiver)
ALTER TABLE public.visitor_qrcodes REPLICA IDENTITY FULL;

-- Adicionar tabela visitor_qrcodes à publicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_qrcodes;

-- Habilitar real-time para outras tabelas importantes
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

ALTER TABLE public.action_plans REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_plans;

ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;

ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

ALTER TABLE public.residents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.residents;

ALTER TABLE public.visitors REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;

ALTER TABLE public.occurrences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.occurrences;

ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

ALTER TABLE public.coordination_staff REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coordination_staff;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;