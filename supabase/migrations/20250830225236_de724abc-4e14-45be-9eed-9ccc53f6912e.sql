-- Create missing tables for resident registration system

-- Create apartments table
CREATE TABLE IF NOT EXISTS public.apartments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    floor TEXT,
    area NUMERIC,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    is_occupied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(condominium_id, number)
);

-- Create linking_codes table  
CREATE TABLE IF NOT EXISTS public.linking_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linking_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for apartments
CREATE POLICY "Multi-tenant access for apartments" 
ON public.apartments 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create RLS policies for linking_codes
CREATE POLICY "Multi-tenant access for linking_codes" 
ON public.linking_codes 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_apartments_updated_at
    BEFORE UPDATE ON public.apartments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linking_codes_updated_at
    BEFORE UPDATE ON public.linking_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample apartments for existing condominiums
INSERT INTO public.apartments (condominium_id, number, floor) 
SELECT 
    c.id as condominium_id,
    apt.number,
    apt.floor
FROM public.condominiums c
CROSS JOIN (
    VALUES 
    ('101', '1'), ('102', '1'), ('103', '1'), ('104', '1'),
    ('201', '2'), ('202', '2'), ('203', '2'), ('204', '2'),
    ('301', '3'), ('302', '3'), ('303', '3'), ('304', '3')
) AS apt(number, floor)
ON CONFLICT (condominium_id, number) DO NOTHING;

-- Create linking codes for existing condominiums using their resident_linking_code
INSERT INTO public.linking_codes (code, condominium_id, expires_at)
SELECT 
    c.resident_linking_code,
    c.id,
    now() + interval '30 days'
FROM public.condominiums c
WHERE c.resident_linking_code IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- Create the auth trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the handle_new_user function to work with the correct schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    linking_code_record RECORD;
    condominium_record RECORD;
    apartment_record RECORD;
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
    
    -- Extract and validate linking code using condominiums table
    BEGIN
        SELECT c.id as condominium_id, c.name as condominium_name, c.resident_linking_code 
        INTO condominium_record
        FROM public.condominiums c 
        WHERE c.resident_linking_code = (user_metadata->>'linking_code')::text;
        
        IF NOT FOUND THEN
            RAISE LOG 'handle_new_user: Invalid linking code: %', user_metadata->>'linking_code';
            RETURN NEW;
        END IF;
        
        RAISE LOG 'handle_new_user: Found valid linking code for condominium_id: %', condominium_record.condominium_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error validating linking code: %', SQLERRM;
        RETURN NEW;
    END;
    
    -- Validate apartment exists and is not occupied
    BEGIN
        SELECT a.* INTO apartment_record
        FROM public.apartments a 
        WHERE a.condominium_id = condominium_record.condominium_id 
        AND a.number = (user_metadata->>'apartment_num')::text;
        
        IF NOT FOUND THEN
            RAISE LOG 'handle_new_user: Apartment % not found in condominium %', 
                      user_metadata->>'apartment_num', condominium_record.condominium_id;
            RETURN NEW;
        END IF;
        
        -- Check if apartment is already occupied
        IF EXISTS (
            SELECT 1 FROM public.residents r 
            WHERE r.condominium_id = condominium_record.condominium_id 
            AND r.apartment_number = (user_metadata->>'apartment_num')::text
        ) THEN
            RAISE LOG 'handle_new_user: Apartment % is already occupied', user_metadata->>'apartment_num';
            RETURN NEW;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error validating apartment: %', SQLERRM;
        RETURN NEW;
    END;
    
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
            condominium_record.condominium_id,
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
    
    -- Create resident record using the existing residents table structure
    BEGIN
        INSERT INTO public.residents (
            profile_id,
            condominium_id,
            apartment_number,
            family_members,
            parking_spaces,
            move_in_date
        ) VALUES (
            (SELECT id FROM public.profiles WHERE user_id = NEW.id),
            condominium_record.condominium_id,
            user_metadata->>'apartment_num',
            family_members_count,
            parking_spaces_count,
            CURRENT_DATE
        );
        
        RAISE LOG 'handle_new_user: Resident record created successfully for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error creating resident record: %', SQLERRM;
        RETURN NEW;
    END;
    
    -- Mark apartment as occupied
    BEGIN
        UPDATE public.apartments 
        SET is_occupied = true, updated_at = now()
        WHERE id = apartment_record.id;
        
        RAISE LOG 'handle_new_user: Apartment marked as occupied for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error updating apartment: %', SQLERRM;
    END;
    
    RAISE LOG 'handle_new_user: Successfully completed for user %', NEW.id;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Unexpected error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;