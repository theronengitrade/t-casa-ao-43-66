-- Corrigir sistema de permissões de coordenação
-- Problema: Coordenadores existentes não têm registro na coordination_staff

-- 1. Primeiro, criar registros na coordination_staff para coordenadores existentes
INSERT INTO public.coordination_staff (
  condominium_id,
  name,
  position,
  phone,
  role,
  has_system_access,
  user_id,
  created_by,
  assigned_date
)
SELECT 
  p.condominium_id,
  p.first_name || ' ' || p.last_name as name,
  'Coordenador Principal' as position,
  p.phone,
  'coordinator'::coordination_member_role as role,
  true as has_system_access,
  p.user_id,
  p.user_id as created_by, -- Auto-criado
  CURRENT_DATE as assigned_date
FROM public.profiles p
WHERE p.role = 'coordinator' 
  AND p.condominium_id IS NOT NULL
  AND p.coordination_staff_id IS NULL; -- Só para os que ainda não têm

-- 2. Atualizar os perfis dos coordenadores com os IDs criados
UPDATE public.profiles 
SET coordination_staff_id = cs.id,
    updated_at = now()
FROM public.coordination_staff cs
WHERE profiles.user_id = cs.user_id 
  AND profiles.role = 'coordinator'
  AND profiles.coordination_staff_id IS NULL;

-- 3. Melhorar a função de permissões para incluir coordenadores por role
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
  -- Primeiro, verificar se é coordenador pelo perfil (fallback para coordenadores sem coordination_staff_id)
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

-- 4. Criar trigger para automaticamente criar coordination_staff para novos coordenadores
CREATE OR REPLACE FUNCTION public.handle_coordinator_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _coordination_staff_id uuid;
BEGIN
  -- Se o perfil foi atualizado para coordinator e não tem coordination_staff_id
  IF NEW.role = 'coordinator' AND NEW.coordination_staff_id IS NULL AND NEW.condominium_id IS NOT NULL THEN
    
    -- Criar registro na coordination_staff
    INSERT INTO public.coordination_staff (
      condominium_id,
      name,
      position,
      phone,
      role,
      has_system_access,
      user_id,
      created_by,
      assigned_date
    ) VALUES (
      NEW.condominium_id,
      NEW.first_name || ' ' || NEW.last_name,
      'Coordenador Principal',
      NEW.phone,
      'coordinator'::coordination_member_role,
      true,
      NEW.user_id,
      NEW.user_id,
      CURRENT_DATE
    ) RETURNING id INTO _coordination_staff_id;
    
    -- Atualizar o perfil com o coordination_staff_id
    NEW.coordination_staff_id := _coordination_staff_id;
  END IF;
  
  RETURN NEW;
END;
$function$

-- Criar trigger para profiles
DROP TRIGGER IF EXISTS coordinator_profile_trigger ON public.profiles;
CREATE TRIGGER coordinator_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coordinator_profile();