-- Atualizar função handle_new_user com logs melhorados e tratamento de erros mais robusto
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
    operation_timestamp TIMESTAMP := now();
BEGIN
    RAISE LOG 'PROCESS_NEW_USER_START: user_id=%, email=%, timestamp=%', 
        NEW.id, NEW.email, operation_timestamp;
    
    -- Extract data from metadata if present (for residents)
    linking_code := NEW.raw_user_meta_data ->> 'linking_code';
    apartment_num := NEW.raw_user_meta_data ->> 'apartment_number';
    user_phone := NEW.raw_user_meta_data ->> 'phone';
    user_floor := NEW.raw_user_meta_data ->> 'floor';
    
    -- Log detalhado dos metadados
    RAISE LOG 'USER_METADATA: user_id=%, linking_code=%, apartment=%, phone=%, floor=%, full_metadata=%', 
        NEW.id, linking_code, apartment_num, user_phone, user_floor, NEW.raw_user_meta_data;
    
    -- Se não tiver linking code, pular processo de residente (pode ser coordinator/super_admin)
    IF linking_code IS NULL OR TRIM(linking_code) = '' THEN
        RAISE LOG 'NO_LINKING_CODE: user_id=%, skipping_resident_process', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Validar dados obrigatórios para residentes
    IF apartment_num IS NULL OR TRIM(apartment_num) = '' THEN
        RAISE LOG 'CRITICAL_ERROR: user_id=%, empty_apartment_number', NEW.id;
        RAISE EXCEPTION 'Número do apartamento é obrigatório para residentes';
    END IF;
    
    RAISE LOG 'RESIDENT_PROCESSING: user_id=%, starting_validation', NEW.id;
    
    -- VALIDAÇÃO CRÍTICA: Usar função de validação completa
    BEGIN
        SELECT public.validate_linking_code_and_apartment(linking_code, apartment_num) 
        INTO validation_result;
        
        RAISE LOG 'VALIDATION_RESULT: user_id=%, result=%', NEW.id, validation_result;
        
        -- Verificar se validação foi bem-sucedida
        IF NOT (validation_result->>'success')::boolean THEN
            RAISE LOG 'VALIDATION_FAILED: user_id=%, error=%, code=%', 
                NEW.id, validation_result->>'error', validation_result->>'code';
            RAISE EXCEPTION 'Falha na validação: % (código: %)', 
                validation_result->>'error', 
                validation_result->>'code';
        END IF;
        
        -- Extrair dados validados
        condo_id := (validation_result->>'condominium_id')::uuid;
        condo_name := validation_result->>'condominium_name';
        
        RAISE LOG 'VALIDATION_SUCCESS: user_id=%, condominium=% (%), apartment=%', 
            NEW.id, condo_name, condo_id, apartment_num;
            
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'VALIDATION_EXCEPTION: user_id=%, error=%', NEW.id, SQLERRM;
            RAISE EXCEPTION 'Erro na validação do código: %', SQLERRM;
    END;
    
    -- Validar e parsear JSON para family_members
    BEGIN
        IF NEW.raw_user_meta_data ->> 'family_members' IS NOT NULL THEN
            user_family_members := (NEW.raw_user_meta_data ->> 'family_members')::jsonb;
            IF jsonb_typeof(user_family_members) != 'array' THEN
                user_family_members := '[]'::jsonb;
                RAISE LOG 'INVALID_FAMILY_JSON: user_id=%, using_empty_array', NEW.id;
            END IF;
        ELSE
            user_family_members := '[]'::jsonb;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            user_family_members := '[]'::jsonb;
            RAISE LOG 'FAMILY_JSON_ERROR: user_id=%, error=%, using_empty_array', NEW.id, SQLERRM;
    END;
    
    -- Validar e parsear JSON para parking_spaces
    BEGIN
        IF NEW.raw_user_meta_data ->> 'parking_spaces' IS NOT NULL THEN
            user_parking_spaces := (NEW.raw_user_meta_data ->> 'parking_spaces')::jsonb;
            IF jsonb_typeof(user_parking_spaces) != 'array' THEN
                user_parking_spaces := '[]'::jsonb;
                RAISE LOG 'INVALID_PARKING_JSON: user_id=%, using_empty_array', NEW.id;
            END IF;
        ELSE
            user_parking_spaces := '[]'::jsonb;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            user_parking_spaces := '[]'::jsonb;
            RAISE LOG 'PARKING_JSON_ERROR: user_id=%, error=%, using_empty_array', NEW.id, SQLERRM;
    END;
    
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
        
        RAISE LOG 'PROFILE_CREATED: user_id=%, profile_id=%', NEW.id, new_profile_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'PROFILE_CREATION_ERROR: user_id=%, error=%', NEW.id, SQLERRM;
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
            true,
            CURRENT_DATE
        );
        
        RAISE LOG 'RESIDENT_CREATED: user_id=%, profile_id=%, condominium=%, apartment=%', 
            NEW.id, new_profile_id, condo_name, apartment_num;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'RESIDENT_CREATION_ERROR: user_id=%, profile_id=%, error=%', 
                NEW.id, new_profile_id, SQLERRM;
            RAISE EXCEPTION 'Erro ao criar registro de residente: %', SQLERRM;
    END;
    
    RAISE LOG 'PROCESS_COMPLETE: user_id=%, successfully_created_resident_in=%, total_duration=%', 
        NEW.id, condo_name, (now() - operation_timestamp);
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'CRITICAL_ERROR: user_id=%, error=%, duration=%', 
            NEW.id, SQLERRM, (now() - operation_timestamp);
        -- Re-raise para prevenir criação de usuário com dados inválidos
        RAISE;
END;
$function$;