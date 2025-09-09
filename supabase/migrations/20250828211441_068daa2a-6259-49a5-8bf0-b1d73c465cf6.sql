-- Fix handle_new_user function to correctly extract phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    linking_code TEXT;
    condo_id UUID;
    apartment_num TEXT;
    user_phone TEXT;
BEGIN
    -- Extract linking code from metadata if present (for residents)
    linking_code := NEW.raw_user_meta_data ->> 'linking_code';
    apartment_num := NEW.raw_user_meta_data ->> 'apartment_number';
    user_phone := NEW.raw_user_meta_data ->> 'phone';
    
    IF linking_code IS NOT NULL THEN
        -- Find condominium by linking code
        SELECT id INTO condo_id 
        FROM public.condominiums 
        WHERE resident_linking_code = linking_code;
        
        IF condo_id IS NOT NULL THEN
            -- Create resident profile
            INSERT INTO public.profiles (user_id, condominium_id, role, first_name, last_name, phone, apartment_number)
            VALUES (
                NEW.id,
                condo_id,
                'resident',
                COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
                COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
                user_phone,  -- Now correctly using phone from metadata
                apartment_num
            );
            
            -- Create resident record in residents table
            INSERT INTO public.residents (profile_id, condominium_id, apartment_number, is_owner, move_in_date)
            VALUES (
                (SELECT id FROM public.profiles WHERE user_id = NEW.id),
                condo_id,
                apartment_num,
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
$$;