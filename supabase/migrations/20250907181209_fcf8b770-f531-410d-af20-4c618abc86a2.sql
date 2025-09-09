-- Povoar tabela coordination_staff com dados de exemplo
INSERT INTO public.coordination_staff (
  name, position, phone, role, has_system_access, 
  assigned_date, condominium_id, created_by
) VALUES 
  ('Ana Silva', 'Coordenadora Geral', '+244923456789', 'coordinator', true, '2024-01-15', 
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1)),
  
  ('João Santos', 'Responsável Financeiro', '+244934567890', 'financial', true, '2024-02-01',
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1)),
   
  ('Maria Costa', 'Segurança', '+244945678901', 'security', false, '2024-01-20',
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1)),
   
  ('Carlos Ferreira', 'Técnico de Manutenção', '+244956789012', 'maintenance', false, '2024-03-01',
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1)),
   
  ('Isabel Rodrigues', 'Administração', '+244967890123', 'administration', true, '2024-01-25',
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1)),
   
  ('Pedro Oliveira', 'Secretário', '+244978901234', 'secretary', false, '2024-02-15',
   (SELECT id FROM condominiums LIMIT 1), 
   (SELECT user_id FROM profiles WHERE role = 'coordinator' LIMIT 1))

ON CONFLICT DO NOTHING;

-- Corrigir função de permissões para retornar permissões baseadas no role
CREATE OR REPLACE FUNCTION public.get_coordination_member_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _permissions jsonb := '{}';
  _member_role text;
  _member_condominium uuid;
  _user_condominium uuid;
BEGIN
  -- Obter condomínio do usuário
  SELECT condominium_id INTO _user_condominium
  FROM public.profiles 
  WHERE user_id = _user_id;
  
  -- Se o usuário é coordenador, tem todas as permissões
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = 'coordinator'
  ) THEN
    RETURN '{"all": true}'::jsonb;
  END IF;
  
  -- Buscar role do membro da coordenação
  SELECT cs.role, cs.condominium_id INTO _member_role, _member_condominium
  FROM public.coordination_staff cs
  WHERE cs.user_id = _user_id 
    AND cs.has_system_access = true
    AND cs.condominium_id = _user_condominium;
  
  -- Se não encontrou membro ativo, retornar vazio
  IF _member_role IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Definir permissões baseadas no role
  CASE _member_role
    WHEN 'financial' THEN
      _permissions := '{"payments": true, "expenses": true, "payroll": true, "financial_reports": true}';
    WHEN 'security' THEN  
      _permissions := '{"visitors": true, "qr_codes": true, "occurrences": true}';
    WHEN 'maintenance' THEN
      _permissions := '{"action_plans": true, "service_providers": true, "occurrences": true}';
    WHEN 'administration' THEN
      _permissions := '{"residents": true, "documents": true, "space_reservations": true}';
    WHEN 'secretary' THEN
      _permissions := '{"announcements": true, "documents": true}';
    ELSE
      _permissions := '{}';
  END CASE;
  
  RETURN _permissions;
END;
$$;