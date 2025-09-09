
-- 1. Recriar função de validação do código de ligação com logs melhorados
CREATE OR REPLACE FUNCTION public.validate_linking_code_and_apartment(_linking_code text, _apartment_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  IF NOT (_normalized_code ~ '^[a-f0-9]{16}$') THEN
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
      'error', 'Código de ligação inválido ou não encontrado',
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

-- 2. Recriar trigger handle_new_user otimizado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    condominium_record RECORD;
    user_metadata JSONB;
    profile_id UUID;
    resident_id UUID;
    registration_timestamp TIMESTAMP := now();
    linking_code_normalized TEXT;
    apartment_number_normalized TEXT;
BEGIN
    -- Log extremamente detalhado do início
    RAISE LOG 'HANDLE_NEW_USER_START: user_id=%, timestamp=%, raw_metadata=%', 
        NEW.id, registration_timestamp, NEW.raw_user_meta_data;
    
    -- Obter metadados do usuário
    user_metadata := NEW.raw_user_meta_data;
    
    -- 1. VALIDAÇÃO: Verificar se há metadados
    IF user_metadata IS NULL THEN
        RAISE LOG 'HANDLE_NEW_USER_SKIP: No user metadata found for user_id=%', NEW.id;
        RETURN NEW;
    END IF;
    
    -- 2. VALIDAÇÃO: Verificar campos obrigatórios
    IF NOT (user_metadata ? 'linking_code') THEN
        RAISE LOG 'HANDLE_NEW_USER_SKIP: No linking_code in metadata for user_id=%', NEW.id;
        RETURN NEW;
    END IF;
    
    IF NOT (user_metadata ? 'apartment_number') THEN
        RAISE LOG 'HANDLE_NEW_USER_SKIP: No apartment_number in metadata for user_id=%', NEW.id;
        RETURN NEW;
    END IF;

    -- Normalizar dados de entrada
    linking_code_normalized := TRIM(LOWER(user_metadata->>'linking_code'));
    apartment_number_normalized := TRIM(UPPER(user_metadata->>'apartment_number'));

    RAISE LOG 'HANDLE_NEW_USER_PROCESSING: linking_code=%, apartment_number=%, user_id=%', 
        linking_code_normalized, apartment_number_normalized, NEW.id;
    
    -- 3. BUSCAR CONDOMÍNIO PELO CÓDIGO DE LIGAÇÃO (COM NORMALIZAÇÃO)
    BEGIN
        SELECT c.id as condominium_id, c.name as condominium_name, c.resident_linking_code 
        INTO condominium_record
        FROM public.condominiums c 
        WHERE LOWER(TRIM(c.resident_linking_code)) = linking_code_normalized;
        
        IF NOT FOUND THEN
            RAISE LOG 'HANDLE_NEW_USER_ERROR: Invalid linking_code=% for user_id=%', 
                linking_code_normalized, NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Found condominium id=%, name=% for user_id=%', 
            condominium_record.condominium_id, condominium_record.condominium_name, NEW.id;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Exception finding condominium: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 4. VERIFICAR SE APARTAMENTO NÃO ESTÁ OCUPADO
    BEGIN
        -- Verificar se apartamento já está ocupado (DUPLA VERIFICAÇÃO)
        IF EXISTS (
            SELECT 1 FROM public.residents r 
            WHERE r.condominium_id = condominium_record.condominium_id 
            AND UPPER(TRIM(r.apartment_number)) = apartment_number_normalized
        ) THEN
            RAISE LOG 'HANDLE_NEW_USER_ERROR: Apartment % already occupied in condominium % for user_id=%', 
                apartment_number_normalized, condominium_record.condominium_id, NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Apartment % is available in condominium % for user_id=%', 
            apartment_number_normalized, condominium_record.condominium_id, NEW.id;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Exception validating apartment: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 5. TRANSAÇÃO ATÔMICA: CRIAR PERFIL E RESIDENTE
    BEGIN
        -- Criar perfil do usuário
        INSERT INTO public.profiles (
            user_id,
            condominium_id,
            role,
            first_name,
            last_name,
            phone,
            apartment_number,
            floor,
            must_change_password
        ) VALUES (
            NEW.id,
            condominium_record.condominium_id,
            'resident',
            COALESCE(user_metadata->>'first_name', ''),
            COALESCE(user_metadata->>'last_name', ''),
            COALESCE(user_metadata->>'phone', ''),
            apartment_number_normalized,
            COALESCE(user_metadata->>'floor', ''),
            false
        ) RETURNING id INTO profile_id;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Profile created with id=% for user_id=%', profile_id, NEW.id;
        
        -- Criar registro de residente
        INSERT INTO public.residents (
            profile_id,
            condominium_id,
            apartment_number,
            floor,
            family_members,
            parking_spaces,
            move_in_date,
            is_owner
        ) VALUES (
            profile_id,
            condominium_record.condominium_id,
            apartment_number_normalized,
            COALESCE(user_metadata->>'floor', ''),
            COALESCE((user_metadata->>'family_members')::jsonb, '[]'::jsonb),
            COALESCE((user_metadata->>'parking_spaces')::jsonb, '[]'::jsonb),
            CURRENT_DATE,
            true
        ) RETURNING id INTO resident_id;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Resident record created with id=% for user_id=%', resident_id, NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_FATAL: Transaction failed for user_id=%: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
    
    RAISE LOG 'HANDLE_NEW_USER_COMPLETE: Successfully processed user_id=%, profile_id=%, resident_id=%, duration=%ms', 
        NEW.id, profile_id, resident_id, EXTRACT(EPOCH FROM (now() - registration_timestamp)) * 1000;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'HANDLE_NEW_USER_FATAL: Unexpected error for user_id=%: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 3. Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
