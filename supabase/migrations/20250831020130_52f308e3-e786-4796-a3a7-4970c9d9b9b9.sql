CREATE OR REPLACE FUNCTION public.process_resident_metadata()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata jsonb;
    family_members_text text;
    parking_spaces_text text;
    family_data jsonb := '[]'::jsonb;
    parking_data jsonb := '[]'::jsonb;
    i integer;
    fam_count integer;
    park_count integer;
BEGIN
    -- Buscar metadata do usuário autenticado
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    IF user_metadata IS NULL THEN
        RETURN NEW;
    END IF;

    -- Agregado Familiar
    family_members_text := user_metadata->>'family_members';
    IF family_members_text IS NOT NULL AND family_members_text <> '' THEN
        IF family_members_text ~ '^[0-9]+$' THEN
            fam_count := family_members_text::int;
            IF fam_count > 0 THEN
                FOR i IN 1..fam_count LOOP
                    family_data := family_data || jsonb_build_array(jsonb_build_object('index', i));
                END LOOP;
            END IF;
        ELSIF jsonb_typeof(user_metadata->'family_members') = 'array' THEN
            family_data := user_metadata->'family_members';
        ELSE
            -- Separado por vírgulas
            FOR i IN SELECT generate_series(1, array_length(string_to_array(family_members_text, ','), 1)) LOOP
                family_data := family_data || jsonb_build_array(
                    jsonb_build_object('name', trim((string_to_array(family_members_text, ','))[i]))
                );
            END LOOP;
        END IF;
    END IF;

    -- Estacionamento
    parking_spaces_text := user_metadata->>'parking_spaces';
    IF parking_spaces_text IS NOT NULL AND parking_spaces_text <> '' THEN
        IF parking_spaces_text ~ '^[0-9]+$' THEN
            park_count := parking_spaces_text::int;
            IF park_count > 0 THEN
                FOR i IN 1..park_count LOOP
                    parking_data := parking_data || jsonb_build_array(
                        jsonb_build_object('number', 'P' || i, 'type', 'Atribuído')
                    );
                END LOOP;
            END IF;
        ELSIF jsonb_typeof(user_metadata->'parking_spaces') = 'array' THEN
            parking_data := user_metadata->'parking_spaces';
        ELSE
            FOR i IN SELECT generate_series(1, array_length(string_to_array(parking_spaces_text, ','), 1)) LOOP
                parking_data := parking_data || jsonb_build_array(
                    jsonb_build_object('number', trim((string_to_array(parking_spaces_text, ','))[i]), 'type', 'Atribuído')
                );
            END LOOP;
        END IF;
    END IF;

    -- Atualizar o registro do residente na tabela residents
    UPDATE residents 
    SET 
        family_members = family_data,
        parking_spaces = parking_data,
        updated_at = now()
    WHERE profile_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';