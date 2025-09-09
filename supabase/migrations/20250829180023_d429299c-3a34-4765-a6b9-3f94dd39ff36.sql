-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    linking_code TEXT;
    condo_id UUID;
    apartment_num TEXT;
    user_phone TEXT;
    user_floor TEXT;
    user_family_members JSONB;
    user_parking_spaces JSONB;
    new_profile_id UUID;
BEGIN
    -- Extract data from metadata if present (for residents)
    linking_code := NEW.raw_user_meta_data ->> 'linking_code';
    apartment_num := NEW.raw_user_meta_data ->> 'apartment_number';
    user_phone := NEW.raw_user_meta_data ->> 'phone';
    user_floor := NEW.raw_user_meta_data ->> 'floor';
    
    -- Parse JSON data for family members and parking spaces
    BEGIN
        user_family_members := (NEW.raw_user_meta_data ->> 'family_members')::jsonb;
    EXCEPTION
        WHEN OTHERS THEN
            user_family_members := '[]'::jsonb;
    END;
    
    BEGIN
        user_parking_spaces := (NEW.raw_user_meta_data ->> 'parking_spaces')::jsonb;
    EXCEPTION
        WHEN OTHERS THEN
            user_parking_spaces := '[]'::jsonb;
    END;
    
    IF linking_code IS NOT NULL THEN
        -- Find condominium by linking code
        SELECT id INTO condo_id 
        FROM public.condominiums 
        WHERE resident_linking_code = linking_code;
        
        IF condo_id IS NOT NULL THEN
            -- Create resident profile
            INSERT INTO public.profiles (user_id, condominium_id, role, first_name, last_name, phone, apartment_number, floor)
            VALUES (
                NEW.id,
                condo_id,
                'resident',
                COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
                COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
                user_phone,
                apartment_num,
                user_floor
            ) RETURNING id INTO new_profile_id;
            
            -- Create resident record in residents table with new fields
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
                apartment_num,
                user_floor,
                user_family_members,
                user_parking_spaces,
                true, -- Default to owner
                CURRENT_DATE
            );
        ELSE
            -- If linking code is invalid, raise an exception to prevent account creation
            RAISE EXCEPTION 'Código de ligação inválido';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;