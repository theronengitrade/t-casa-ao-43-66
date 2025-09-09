-- Função para obter permissões de membro da coordenação
CREATE OR REPLACE FUNCTION public.get_coordination_member_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _permissions jsonb := '{}'::jsonb;
  _member_role coordination_member_role;
BEGIN
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
$$;

-- Função para promover residente a membro da coordenação
CREATE OR REPLACE FUNCTION public.promote_resident_to_coordination(_resident_id uuid, _role coordination_member_role, _position text, _has_system_access boolean DEFAULT true)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _resident RECORD;
  _coordination_staff_id uuid;
  _condominium_id uuid;
BEGIN
  -- Buscar dados do residente
  SELECT r.*, p.first_name, p.last_name, p.phone, p.condominium_id, p.user_id
  INTO _resident
  FROM public.residents r
  JOIN public.profiles p ON r.profile_id = p.id
  WHERE r.id = _resident_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Residente não encontrado');
  END IF;
  
  _condominium_id := _resident.condominium_id;
  
  -- Verificar se já é membro da coordenação
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _resident.user_id AND coordination_staff_id IS NOT NULL) THEN
    RETURN json_build_object('success', false, 'error', 'Residente já é membro da coordenação');
  END IF;
  
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
    _condominium_id,
    _resident.first_name || ' ' || _resident.last_name,
    _position,
    _resident.phone,
    _role,
    _has_system_access,
    _resident.user_id,
    auth.uid(),
    CURRENT_DATE
  ) RETURNING id INTO _coordination_staff_id;
  
  -- Atualizar profile com coordination_staff_id
  UPDATE public.profiles 
  SET coordination_staff_id = _coordination_staff_id,
      updated_at = now()
  WHERE user_id = _resident.user_id;
  
  RETURN json_build_object(
    'success', true,
    'coordination_staff_id', _coordination_staff_id,
    'message', 'Residente promovido com sucesso à coordenação'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Função para remover membro da coordenação (despromover)
CREATE OR REPLACE FUNCTION public.remove_from_coordination(_coordination_staff_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Remover coordination_staff_id do profile
  UPDATE public.profiles 
  SET coordination_staff_id = NULL,
      updated_at = now()
  WHERE coordination_staff_id = _coordination_staff_id;
  
  -- Remover da coordination_staff
  DELETE FROM public.coordination_staff 
  WHERE id = _coordination_staff_id;
  
  RETURN json_build_object('success', true, 'message', 'Membro removido da coordenação');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;