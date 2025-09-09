-- =====================================================
-- CORREÇÕES CRÍTICAS PARA SISTEMA DE REGISTO T-CASA
-- =====================================================

-- 1. CORRIGIR FUNÇÕES COM PROBLEMAS DE SEGURANÇA (SET search_path)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS TABLE(profile_data json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT to_json(p.*) as profile_data
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_monthly_payments(_condominium_id uuid, _reference_month date, _amount numeric, _description text DEFAULT 'Quota mensal'::text, _due_days integer DEFAULT 10)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  _resident RECORD;
  _due_date DATE;
  _currency currency_type;
  _count INTEGER := 0;
BEGIN
  -- Get condominium currency
  SELECT currency INTO _currency FROM condominiums WHERE id = _condominium_id;
  
  -- Calculate due date (10th of the month after reference month)
  _due_date := (DATE_TRUNC('month', _reference_month) + INTERVAL '1 month' + INTERVAL '10 days')::DATE;
  
  -- Generate payments for all residents in condominium
  FOR _resident IN 
    SELECT r.id, r.profile_id 
    FROM residents r 
    WHERE r.condominium_id = _condominium_id
  LOOP
    -- Check if payment already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM payments 
      WHERE resident_id = _resident.id 
      AND reference_month = _reference_month
    ) THEN
      INSERT INTO payments (
        condominium_id,
        resident_id,
        description,
        amount,
        currency,
        due_date,
        status,
        reference_month
      ) VALUES (
        _condominium_id,
        _resident.id,
        _description,
        _amount,
        _currency,
        _due_date,
        'pending',
        _reference_month
      );
      
      _count := _count + 1;
    END IF;
  END LOOP;
  
  RETURN _count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_super_admin(user_email text, user_password text, first_name text, last_name text, phone text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- This function will help create super admin profiles
  -- Note: The actual user creation must be done through Supabase Auth
  -- This function is for creating the profile after user exists
  
  -- Check if user already exists by email in profiles
  SELECT p.user_id INTO new_user_id 
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  WHERE u.email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já existe com este email'
    );
  END IF;
  
  -- Get user_id by email from auth.users
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado. Crie primeiro no painel de autenticação.'
    );
  END IF;
  
  -- Create super admin profile
  INSERT INTO public.profiles (
    user_id,
    condominium_id,
    role,
    first_name,
    last_name,
    phone,
    apartment_number,
    must_change_password
  ) VALUES (
    new_user_id,
    NULL, -- Super admin não pertence a um condomínio específico
    'super_admin',
    first_name,
    last_name,
    phone,
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Super administrador criado com sucesso',
    'user_id', new_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro ao criar super admin: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_super_admin_profile(_user_id uuid, _first_name text, _last_name text, _phone text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert super admin profile directly
  INSERT INTO public.profiles (
    user_id,
    condominium_id,
    role,
    first_name,
    last_name,
    phone,
    apartment_number,
    must_change_password
  ) VALUES (
    _user_id,
    NULL,
    'super_admin',
    _first_name,
    _last_name,
    _phone,
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Perfil de super administrador criado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_mario_super_admin()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  mario_user_id UUID;
BEGIN
  -- Buscar o usuário Mario pelo email
  SELECT u.id INTO mario_user_id
  FROM auth.users u
  WHERE u.email = 'theronengitrade@gmail.com';
  
  IF mario_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário theronengitrade@gmail.com não encontrado. Crie primeiro no painel.'
    );
  END IF;
  
  -- Verificar se já existe perfil para este usuário
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = mario_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Perfil já existe para este usuário'
    );
  END IF;
  
  -- Criar perfil de super admin
  INSERT INTO public.profiles (
    user_id,
    condominium_id,
    role,
    first_name,
    last_name,
    phone,
    apartment_number,
    must_change_password
  ) VALUES (
    mario_user_id,
    NULL,
    'super_admin',
    'Mario',
    'Manuel',
    '+244933696567',
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Super administrador Mario Manuel criado com sucesso!',
    'user_id', mario_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.get_condominium_with_coordinator(_condominium_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  _result json;
BEGIN
  SELECT json_build_object(
    'condominium', json_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.email,
      'address', c.address,
      'phone', c.phone,
      'currency', c.currency,
      'resident_linking_code', c.resident_linking_code
    ),
    'coordinator', CASE 
      WHEN p.id IS NOT NULL THEN json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'phone', p.phone,
        'must_change_password', p.must_change_password
      )
      ELSE NULL
    END,
    'license', CASE
      WHEN l.id IS NOT NULL THEN json_build_object(
        'id', l.id,
        'status', l.status,
        'start_date', l.start_date,
        'end_date', l.end_date
      )
      ELSE NULL
    END
  ) INTO _result
  FROM public.condominiums c
  LEFT JOIN public.profiles p ON c.id = p.condominium_id AND p.role = 'coordinator'
  LEFT JOIN public.licenses l ON c.id = l.condominium_id
  WHERE c.id = _condominium_id;

  RETURN COALESCE(_result, json_build_object('error', 'Condomínio não encontrado'));
END;
$function$;

-- 2. FUNÇÃO CRÍTICA: VALIDAÇÃO DE CÓDIGO DE LIGAÇÃO MELHORADA
-- =====================================================

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
BEGIN
  -- Log da tentativa de validação
  RAISE LOG 'Validating linking code: % for apartment: %', _linking_code, _apartment_number;
  
  -- Limpar e normalizar o código
  _linking_code := TRIM(LOWER(_linking_code));
  
  -- Buscar condomínio por código de ligação
  SELECT id, name INTO _condominium_id, _condominium_name
  FROM public.condominiums 
  WHERE LOWER(resident_linking_code) = _linking_code;
  
  -- Verificar se o código é válido
  IF _condominium_id IS NULL THEN
    RAISE LOG 'Invalid linking code: %', _linking_code;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação inválido',
      'code', 'INVALID_LINKING_CODE'
    );
  END IF;
  
  -- Verificar se o apartamento já está ocupado
  SELECT COUNT(*) INTO _existing_resident_count
  FROM public.residents 
  WHERE condominium_id = _condominium_id 
  AND UPPER(TRIM(apartment_number)) = UPPER(TRIM(_apartment_number));
  
  IF _existing_resident_count > 0 THEN
    RAISE LOG 'Apartment % already occupied in condominium %', _apartment_number, _condominium_name;
    RETURN json_build_object(
      'success', false,
      'error', 'Apartamento já está ocupado por outro residente',
      'code', 'APARTMENT_OCCUPIED'
    );
  END IF;
  
  -- Sucesso - código válido e apartamento disponível
  RAISE LOG 'Validation successful for linking code: % apartment: % condominium: %', 
    _linking_code, _apartment_number, _condominium_name;
    
  RETURN json_build_object(
    'success', true,
    'condominium_id', _condominium_id,
    'condominium_name', _condominium_name,
    'message', 'Código válido e apartamento disponível'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in validate_linking_code_and_apartment: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno na validação: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$function$;

-- 3. FUNÇÃO HANDLE_NEW_USER COMPLETAMENTE REESCRITA E SEGURA
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    linking_code TEXT;
    condo_id UUID;
    condo_name TEXT;
    apartment_num TEXT;
    user_phone TEXT;
    user_floor TEXT;
    user_family_members JSONB;
    user_parking_spaces JSONB;
    new_profile_id UUID;
    existing_resident_count INTEGER;
    validation_result JSON;
BEGIN
    RAISE LOG 'Processing new user registration: % (email: %)', NEW.id, NEW.email;
    
    -- Extract data from metadata if present (for residents)
    linking_code := NEW.raw_user_meta_data ->> 'linking_code';
    apartment_num := NEW.raw_user_meta_data ->> 'apartment_number';
    user_phone := NEW.raw_user_meta_data ->> 'phone';
    user_floor := NEW.raw_user_meta_data ->> 'floor';
    
    -- Log dos dados recebidos
    RAISE LOG 'User metadata - linking_code: %, apartment: %, phone: %, floor: %', 
        linking_code, apartment_num, user_phone, user_floor;
    
    -- Validar e parsear JSON para family_members
    BEGIN
        IF NEW.raw_user_meta_data ->> 'family_members' IS NOT NULL THEN
            user_family_members := (NEW.raw_user_meta_data ->> 'family_members')::jsonb;
            -- Validar estrutura do JSON
            IF jsonb_typeof(user_family_members) != 'array' THEN
                user_family_members := '[]'::jsonb;
                RAISE LOG 'Invalid family_members JSON, using empty array';
            END IF;
        ELSE
            user_family_members := '[]'::jsonb;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            user_family_members := '[]'::jsonb;
            RAISE LOG 'Error parsing family_members JSON: %, using empty array', SQLERRM;
    END;
    
    -- Validar e parsear JSON para parking_spaces
    BEGIN
        IF NEW.raw_user_meta_data ->> 'parking_spaces' IS NOT NULL THEN
            user_parking_spaces := (NEW.raw_user_meta_data ->> 'parking_spaces')::jsonb;
            -- Validar estrutura do JSON
            IF jsonb_typeof(user_parking_spaces) != 'array' THEN
                user_parking_spaces := '[]'::jsonb;
                RAISE LOG 'Invalid parking_spaces JSON, using empty array';
            END IF;
        ELSE
            user_parking_spaces := '[]'::jsonb;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            user_parking_spaces := '[]'::jsonb;
            RAISE LOG 'Error parsing parking_spaces JSON: %, using empty array', SQLERRM;
    END;
    
    -- Só processar se tiver linking code (para residentes)
    IF linking_code IS NOT NULL THEN
        RAISE LOG 'Processing resident registration with linking code: %', linking_code;
        
        -- VALIDAÇÃO DUPLA: Usar função de validação segura
        SELECT public.validate_linking_code_and_apartment(linking_code, apartment_num) 
        INTO validation_result;
        
        -- Verificar resultado da validação
        IF NOT (validation_result->>'success')::boolean THEN
            RAISE EXCEPTION 'Falha na validação: % (código: %)', 
                validation_result->>'error', 
                validation_result->>'code';
        END IF;
        
        -- Extrair dados validados
        condo_id := (validation_result->>'condominium_id')::uuid;
        condo_name := validation_result->>'condominium_name';
        
        RAISE LOG 'Validation successful - condominium: % (%), apartment: %', 
            condo_name, condo_id, apartment_num;
        
        -- Validar dados obrigatórios
        IF apartment_num IS NULL OR TRIM(apartment_num) = '' THEN
            RAISE EXCEPTION 'Número do apartamento é obrigatório';
        END IF;
        
        -- Criar perfil do residente
        BEGIN
            INSERT INTO public.profiles (
                user_id, 
                condominium_id, 
                role, 
                first_name, 
                last_name, 
                phone, 
                apartment_number, 
                floor
            )
            VALUES (
                NEW.id,
                condo_id,
                'resident',
                COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
                COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
                user_phone,
                TRIM(apartment_num),
                user_floor
            ) RETURNING id INTO new_profile_id;
            
            RAISE LOG 'Profile created successfully: %', new_profile_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
        END;
        
        -- Criar registro na tabela residents
        BEGIN
            INSERT INTO public.residents (
                profile_id, 
                condominium_id, 
                apartment_number, 
                floor,
                family_members,
                parking_spaces,
                is_owner, 
                move_in_date
            )
            VALUES (
                new_profile_id,
                condo_id,
                TRIM(apartment_num),
                user_floor,
                user_family_members,
                user_parking_spaces,
                true, -- Default to owner
                CURRENT_DATE
            );
            
            RAISE LOG 'Resident record created successfully for profile: %', new_profile_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Erro ao criar registro de residente: %', SQLERRM;
        END;
        
        RAISE LOG 'User registration completed successfully for: % in condominium: %', 
            NEW.email, condo_name;
    ELSE
        RAISE LOG 'No linking code provided, skipping resident profile creation for user: %', NEW.id;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'CRITICAL ERROR in handle_new_user for user %: %', NEW.id, SQLERRM;
        -- Re-raise the exception to prevent user creation with invalid data
        RAISE;
END;
$function$;