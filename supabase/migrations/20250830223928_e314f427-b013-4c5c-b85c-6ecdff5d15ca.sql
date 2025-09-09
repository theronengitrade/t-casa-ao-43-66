-- Fix registration trigger with improved error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    linking_code_data RECORD;
    condominium_data RECORD;
    apartment_data RECORD;
    family_members_count INTEGER := 0;
    parking_spaces_count INTEGER := 0;
    user_metadata JSONB;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user: Starting for user_id %', NEW.id;
    
    -- Get user metadata
    user_metadata := NEW.raw_user_meta_data;
    RAISE LOG 'handle_new_user: User metadata: %', user_metadata;
    
    -- Validate required fields in metadata
    IF user_metadata IS NULL THEN
        RAISE LOG 'handle_new_user: No user metadata found';
        RETURN NEW;
    END IF;
    
    IF NOT (user_metadata ? 'linking_code') THEN
        RAISE LOG 'handle_new_user: No linking_code in metadata';
        RETURN NEW;
    END IF;
    
    IF NOT (user_metadata ? 'apartment_num') THEN
        RAISE LOG 'handle_new_user: No apartment_num in metadata';
        RETURN NEW;
    END IF;
    
    -- Extract and validate linking code
    BEGIN
        SELECT * INTO linking_code_data 
        FROM public.linking_codes 
        WHERE code = (user_metadata->>'linking_code')::text
        AND expires_at > NOW()
        AND used_by IS NULL;
        
        IF NOT FOUND THEN
            RAISE LOG 'handle_new_user: Invalid or expired linking code: %', user_metadata->>'linking_code';
            RETURN NEW;
        END IF;
        
        RAISE LOG 'handle_new_user: Found valid linking code for condominium_id: %', linking_code_data.condominium_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error validating linking code: %', SQLERRM;
        RETURN NEW;
    END;
    
    -- Get condominium data
    SELECT * INTO condominium_data 
    FROM public.condominiums 
    WHERE id = linking_code_data.condominium_id;
    
    IF NOT FOUND THEN
        RAISE LOG 'handle_new_user: Condominium not found for id: %', linking_code_data.condominium_id;
        RETURN NEW;
    END IF;
    
    -- Validate apartment exists in this condominium
    SELECT * INTO apartment_data 
    FROM public.apartments 
    WHERE condominium_id = linking_code_data.condominium_id 
    AND number = (user_metadata->>'apartment_num')::text;
    
    IF NOT FOUND THEN
        RAISE LOG 'handle_new_user: Apartment % not found in condominium %', 
                  user_metadata->>'apartment_num', linking_code_data.condominium_id;
        RETURN NEW;
    END IF;
    
    -- Parse family members and parking spaces safely
    BEGIN
        IF user_metadata ? 'family_members' AND user_metadata->>'family_members' != '' THEN
            family_members_count := (user_metadata->>'family_members')::INTEGER;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error parsing family_members, using 0';
        family_members_count := 0;
    END;
    
    BEGIN
        IF user_metadata ? 'parking_spaces' AND user_metadata->>'parking_spaces' != '' THEN
            parking_spaces_count := (user_metadata->>'parking_spaces')::INTEGER;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error parsing parking_spaces, using 0';
        parking_spaces_count := 0;
    END;
    
    RAISE LOG 'handle_new_user: Parsed family_members: %, parking_spaces: %', 
              family_members_count, parking_spaces_count;
    
    -- Create profile
    BEGIN
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
            NEW.id,
            linking_code_data.condominium_id,
            'resident',
            COALESCE(user_metadata->>'first_name', ''),
            COALESCE(user_metadata->>'last_name', ''),
            COALESCE(user_metadata->>'phone', ''),
            user_metadata->>'apartment_num',
            false
        );
        
        RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error creating profile: %', SQLERRM;
        RETURN NEW;
    END;
    
    -- Create resident record
    BEGIN
        INSERT INTO public.residents (
            user_id,
            condominium_id,
            apartment_id,
            family_members,
            parking_spaces,
            move_in_date
        ) VALUES (
            NEW.id,
            linking_code_data.condominium_id,
            apartment_data.id,
            family_members_count,
            parking_spaces_count,
            CURRENT_DATE
        );
        
        RAISE LOG 'handle_new_user: Resident record created successfully for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error creating resident record: %', SQLERRM;
        RETURN NEW;
    END;
    
    -- Mark linking code as used
    BEGIN
        UPDATE public.linking_codes 
        SET used_by = NEW.id, used_at = NOW()
        WHERE id = linking_code_data.id;
        
        RAISE LOG 'handle_new_user: Linking code marked as used for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error updating linking code: %', SQLERRM;
    END;
    
    RAISE LOG 'handle_new_user: Successfully completed for user %', NEW.id;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Unexpected error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;