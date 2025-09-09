-- Corrigir funções com search_path inseguro
CREATE OR REPLACE FUNCTION get_coordination_member_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _permissions jsonb := '{}';
  _member_role text;
BEGIN
  -- Buscar role do membro da coordenação
  SELECT cs.role::text, cs.permissions
  INTO _member_role, _permissions
  FROM public.coordination_staff cs
  JOIN public.profiles p ON p.coordination_staff_id = cs.id
  WHERE p.user_id = _user_id AND cs.has_system_access = true;
  
  -- Se não encontrou, retornar permissões vazias
  IF _member_role IS NULL THEN
    RETURN '{}';
  END IF;
  
  -- Definir permissões base por role
  CASE _member_role
    WHEN 'coordinator' THEN
      _permissions := _permissions || '{"all": true}'::jsonb;
    WHEN 'financial' THEN
      _permissions := _permissions || '{"payments": true, "expenses": true, "payroll": true, "financial_reports": true}'::jsonb;
    WHEN 'security' THEN
      _permissions := _permissions || '{"visitors": true, "qr_codes": true, "occurrences": true, "announcements": true}'::jsonb;
    WHEN 'maintenance' THEN
      _permissions := _permissions || '{"action_plans": true, "service_providers": true, "occurrences": true}'::jsonb;
    WHEN 'administration' THEN
      _permissions := _permissions || '{"residents": true, "documents": true, "space_reservations": true}'::jsonb;
    WHEN 'secretary' THEN
      _permissions := _permissions || '{"announcements": true, "documents": true, "residents": true}'::jsonb;
  END CASE;
  
  RETURN _permissions;
END;
$$;

-- Corrigir função has_coordination_permission
CREATE OR REPLACE FUNCTION has_coordination_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _permissions jsonb;
BEGIN
  _permissions := public.get_coordination_member_permissions(_user_id);
  
  -- Se tem permissão "all", pode tudo
  IF (_permissions->>'all')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão específica
  RETURN (_permissions->>_permission)::boolean = true;
END;
$$;