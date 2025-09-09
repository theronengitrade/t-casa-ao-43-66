-- CORREÇÃO DOS AVISOS DE SEGURANÇA DETECTADOS

-- 1. Corrigir o search_path da função handle_new_user para ser imutável
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    condominium_record RECORD;
    apartment_record RECORD;
    family_members_count INTEGER := 0;
    parking_spaces_count INTEGER := 0;
    user_metadata JSONB;
    profile_id UUID;
    resident_id UUID;
    registration_timestamp TIMESTAMP := now();
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

    RAISE LOG 'HANDLE_NEW_USER_PROCESSING: linking_code=%, apartment_number=%, user_id=%', 
        user_metadata->>'linking_code', user_metadata->>'apartment_number', NEW.id;
    
    -- 3. BUSCAR CONDOMÍNIO PELO CÓDIGO DE LIGAÇÃO
    BEGIN
        SELECT c.id as condominium_id, c.name as condominium_name, c.resident_linking_code 
        INTO condominium_record
        FROM public.condominiums c 
        WHERE c.resident_linking_code = (user_metadata->>'linking_code')::text;
        
        IF NOT FOUND THEN
            RAISE LOG 'HANDLE_NEW_USER_ERROR: Invalid linking_code=% for user_id=%', 
                user_metadata->>'linking_code', NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Found condominium id=%, name=% for user_id=%', 
            condominium_record.condominium_id, condominium_record.condominium_name, NEW.id;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Exception finding condominium: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 4. VERIFICAR SE APARTAMENTO EXISTE E NÃO ESTÁ OCUPADO
    BEGIN
        SELECT a.* INTO apartment_record
        FROM public.apartments a 
        WHERE a.condominium_id = condominium_record.condominium_id 
        AND a.number = (user_metadata->>'apartment_number')::text;
        
        IF NOT FOUND THEN
            RAISE LOG 'HANDLE_NEW_USER_ERROR: Apartment % not found in condominium % for user_id=%', 
                user_metadata->>'apartment_number', condominium_record.condominium_id, NEW.id;
            RETURN NEW;
        END IF;
        
        -- Verificar se apartamento já está ocupado
        IF EXISTS (
            SELECT 1 FROM public.residents r 
            WHERE r.condominium_id = condominium_record.condominium_id 
            AND r.apartment_number = (user_metadata->>'apartment_number')::text
        ) THEN
            RAISE LOG 'HANDLE_NEW_USER_ERROR: Apartment % already occupied in condominium % for user_id=%', 
                user_metadata->>'apartment_number', condominium_record.condominium_id, NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Apartment % is available in condominium % for user_id=%', 
            user_metadata->>'apartment_number', condominium_record.condominium_id, NEW.id;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Exception validating apartment: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 5. PROCESSAR MEMBROS DA FAMÍLIA E VAGAS (OPCIONAL)
    BEGIN
        IF user_metadata ? 'family_members' AND user_metadata->>'family_members' != '' THEN
            family_members_count := (user_metadata->>'family_members')::INTEGER;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_WARNING: Error parsing family_members, using 0 for user_id=%', NEW.id;
        family_members_count := 0;
    END;
    
    BEGIN
        IF user_metadata ? 'parking_spaces' AND user_metadata->>'parking_spaces' != '' THEN
            parking_spaces_count := (user_metadata->>'parking_spaces')::INTEGER;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_WARNING: Error parsing parking_spaces, using 0 for user_id=%', NEW.id;
        parking_spaces_count := 0;
    END;
    
    RAISE LOG 'HANDLE_NEW_USER_DATA: family_members=%, parking_spaces=% for user_id=%', 
        family_members_count, parking_spaces_count, NEW.id;
    
    -- 6. CRIAR PERFIL DO USUÁRIO
    BEGIN
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
            user_metadata->>'apartment_number',
            COALESCE(user_metadata->>'floor', ''),
            false
        ) RETURNING id INTO profile_id;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Profile created with id=% for user_id=%', profile_id, NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Failed to create profile: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 7. CRIAR REGISTRO DE MORADOR
    BEGIN
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
            user_metadata->>'apartment_number',
            COALESCE(user_metadata->>'floor', ''),
            family_members_count,
            parking_spaces_count,
            CURRENT_DATE,
            true
        ) RETURNING id INTO resident_id;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Resident record created with id=% for user_id=%', resident_id, NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_ERROR: Failed to create resident record: % for user_id=%', SQLERRM, NEW.id;
        RETURN NEW;
    END;
    
    -- 8. MARCAR APARTAMENTO COMO OCUPADO
    BEGIN
        UPDATE public.apartments 
        SET is_occupied = true, updated_at = now()
        WHERE id = apartment_record.id;
        
        RAISE LOG 'HANDLE_NEW_USER_SUCCESS: Apartment marked as occupied for user_id=%', NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'HANDLE_NEW_USER_WARNING: Failed to mark apartment as occupied: % for user_id=%', SQLERRM, NEW.id;
    END;
    
    RAISE LOG 'HANDLE_NEW_USER_COMPLETE: Successfully processed user_id=%, profile_id=%, resident_id=%, duration=%ms', 
        NEW.id, profile_id, resident_id, EXTRACT(EPOCH FROM (now() - registration_timestamp)) * 1000;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'HANDLE_NEW_USER_FATAL: Unexpected error for user_id=%: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;