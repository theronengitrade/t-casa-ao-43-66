-- CORREÇÃO COMPLETA DE SEGURANÇA: Corrigir search_path de todas as funções que não têm
-- Isso é crítico para segurança do sistema

-- 1. Corrigir função validate_linking_code_and_apartment
CREATE OR REPLACE FUNCTION public.validate_linking_code_and_apartment(_linking_code text, _apartment_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _condominium_id uuid;
  _condominium_name text;
  _existing_resident_count integer;
  _normalized_code text;
  _normalized_apartment text;
  _validation_timestamp timestamp := now();
BEGIN
  -- Log detalhado da tentativa de validação
  RAISE LOG 'VALIDATION_START: timestamp=%, code=%, apartment=%', 
    _validation_timestamp, _linking_code, _apartment_number;
  
  -- Normalizar e validar entrada
  _normalized_code := TRIM(LOWER(_linking_code));
  _normalized_apartment := TRIM(UPPER(_apartment_number));
  
  -- 1. VALIDAÇÃO: Código não pode estar vazio
  IF _normalized_code IS NULL OR _normalized_code = '' THEN
    RAISE LOG 'VALIDATION_FAILED: empty_code, timestamp=%', _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação não pode estar vazio',
      'code', 'EMPTY_LINKING_CODE'
    );
  END IF;
  
  -- 2. VALIDAÇÃO: Formato do código (16 caracteres hexadecimais)
  IF NOT is_valid_linking_code_format(_normalized_code) THEN
    RAISE LOG 'VALIDATION_FAILED: invalid_format, code=%, timestamp=%', 
      _normalized_code, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Formato de código inválido. Deve conter 16 caracteres hexadecimais',
      'code', 'INVALID_FORMAT'
    );
  END IF;
  
  -- 3. VALIDAÇÃO: Apartamento não pode estar vazio
  IF _normalized_apartment IS NULL OR _normalized_apartment = '' THEN
    RAISE LOG 'VALIDATION_FAILED: empty_apartment, timestamp=%', _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Número do apartamento é obrigatório',
      'code', 'EMPTY_APARTMENT'
    );
  END IF;
  
  -- 4. VALIDAÇÃO CRÍTICA: Buscar condomínio por código (case-insensitive, EXATO)
  SELECT id, name INTO _condominium_id, _condominium_name
  FROM public.condominiums 
  WHERE LOWER(TRIM(resident_linking_code)) = _normalized_code;
  
  -- 5. VALIDAÇÃO: Código deve existir
  IF _condominium_id IS NULL THEN
    RAISE LOG 'VALIDATION_FAILED: invalid_code, code=%, timestamp=%', 
      _normalized_code, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação inválido ou expirado',
      'code', 'INVALID_LINKING_CODE'
    );
  END IF;
  
  -- 6. VALIDAÇÃO CRÍTICA: Apartamento não pode estar ocupado
  SELECT COUNT(*) INTO _existing_resident_count
  FROM public.residents 
  WHERE condominium_id = _condominium_id 
  AND UPPER(TRIM(apartment_number)) = _normalized_apartment;
  
  IF _existing_resident_count > 0 THEN
    RAISE LOG 'VALIDATION_FAILED: apartment_occupied, condominium=%, apartment=%, count=%, timestamp=%', 
      _condominium_name, _normalized_apartment, _existing_resident_count, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Apartamento ' || _normalized_apartment || ' já está ocupado por outro residente',
      'code', 'APARTMENT_OCCUPIED'
    );
  END IF;
  
  -- 7. SUCESSO: Todas as validações passaram
  RAISE LOG 'VALIDATION_SUCCESS: condominium=% (%), apartment=%, timestamp=%', 
    _condominium_name, _condominium_id, _normalized_apartment, _validation_timestamp;
    
  RETURN json_build_object(
    'success', true,
    'condominium_id', _condominium_id,
    'condominium_name', _condominium_name,
    'normalized_code', _normalized_code,
    'normalized_apartment', _normalized_apartment,
    'validation_timestamp', _validation_timestamp,
    'message', 'Código válido e apartamento disponível'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'VALIDATION_ERROR: code=%, apartment=%, error=%, timestamp=%', 
      _linking_code, _apartment_number, SQLERRM, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno na validação: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$function$;

-- 2. Corrigir outras funções críticas
CREATE OR REPLACE FUNCTION public.create_coordinator_profile(_user_id uuid, _condominium_id uuid, _first_name text, _last_name text, _phone text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _profile_id uuid;
  _result json;
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já possui um perfil no sistema',
      'code', 'USER_ALREADY_EXISTS'
    );
  END IF;

  -- Check if condominium exists
  IF NOT EXISTS (SELECT 1 FROM public.condominiums WHERE id = _condominium_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Condomínio não encontrado',
      'code', 'CONDOMINIUM_NOT_FOUND'
    );
  END IF;

  -- Check if condominium already has a coordinator
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE condominium_id = _condominium_id AND role = 'coordinator'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Condomínio já possui um coordenador',
      'code', 'COORDINATOR_EXISTS'
    );
  END IF;

  -- Create coordinator profile
  INSERT INTO public.profiles (
    user_id,
    condominium_id,
    role,
    first_name,
    last_name,
    phone,
    must_change_password
  ) VALUES (
    _user_id,
    _condominium_id,
    'coordinator',
    _first_name,
    _last_name,
    _phone,
    true -- Force password change on first login
  ) RETURNING id INTO _profile_id;

  -- Return success with profile data
  RETURN json_build_object(
    'success', true,
    'message', 'Coordenador criado com sucesso',
    'data', json_build_object(
      'profile_id', _profile_id,
      'user_id', _user_id,
      'condominium_id', _condominium_id,
      'role', 'coordinator'
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$function$;

-- 3. Corrigir função log_audit_trail
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log detalhado da operação
  RAISE LOG 'AUDIT: % operation on table % by user % for record %', 
    TG_OP, TG_TABLE_NAME, auth.uid(), COALESCE(NEW.id, OLD.id);
    
  INSERT INTO public.audit_logs (
    user_id,
    condominium_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.condominium_id, OLD.condominium_id, get_user_condominium(auth.uid())),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro mas não falha a operação principal
    RAISE LOG 'AUDIT ERROR: Failed to log operation % on table %: %', 
      TG_OP, TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$function$;