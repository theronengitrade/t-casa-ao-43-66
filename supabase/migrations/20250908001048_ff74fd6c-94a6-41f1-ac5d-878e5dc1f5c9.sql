-- Parte 3: Melhorar a função de permissões para incluir coordenadores por role

CREATE OR REPLACE FUNCTION public.get_coordination_member_permissions(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _permissions jsonb := '{}'::jsonb;
  _member_role public.coordination_member_role;
  _profile_role user_role;
BEGIN
  -- Primeiro, verificar se é coordenador pelo perfil
  SELECT role INTO _profile_role
  FROM public.profiles
  WHERE user_id = _user_id;
  
  -- Se é coordenador pelo perfil, dar permissões totais
  IF _profile_role = 'coordinator' THEN
    RETURN '{"all": true}'::jsonb;
  END IF;
  
  -- Buscar função do membro na coordenação através do profile
  SELECT cs.role INTO _member_role
  FROM public.coordination_staff cs
  JOIN public.profiles p ON p.coordination_staff_id = cs.id
  WHERE p.user_id = _user_id 
  AND cs.has_system_access = true;
  
  -- Se não encontrou, retornar vazio
  IF _member_role IS NULL THEN
    RETURN _permissions;
  END IF;
  
  -- Definir permissões baseadas na função
  CASE _member_role
    WHEN 'coordinator' THEN
      _permissions := '{"all": true}'::jsonb;
    WHEN 'financial' THEN
      _permissions := '{"payments": true, "expenses": true, "financial_reports": true}'::jsonb;
    WHEN 'security' THEN
      _permissions := '{"visitors": true, "qr_codes": true, "occurrences": true}'::jsonb;
    WHEN 'maintenance' THEN
      _permissions := '{"action_plans": true, "service_providers": true, "occurrences": true}'::jsonb;
    WHEN 'administration' THEN
      _permissions := '{"announcements": true, "documents": true, "space_reservations": true, "residents": true}'::jsonb;
    WHEN 'secretary' THEN
      _permissions := '{"announcements": true, "documents": true, "visitors": true}'::jsonb;
    ELSE
      _permissions := '{}'::jsonb;
  END CASE;
  
  RETURN _permissions;
END;
$function$