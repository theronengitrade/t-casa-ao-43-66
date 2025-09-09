-- Função para processar dados do agregado familiar e estacionamento do metadata do usuário
CREATE OR REPLACE FUNCTION process_resident_metadata() 
RETURNS TRIGGER AS $$
DECLARE
    user_metadata jsonb;
    family_data jsonb := '[]'::jsonb;
    parking_data jsonb := '[]'::jsonb;
    family_members_text text;
    parking_spaces_text text;
    family_array text[];
    parking_array text[];
    member_name text;
    space_info text;
BEGIN
    -- Buscar metadata do usuário autenticado
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    IF user_metadata IS NOT NULL THEN
        -- Processar família se existe no metadata
        family_members_text := user_metadata->>'family_members';
        IF family_members_text IS NOT NULL AND family_members_text != '' THEN
            -- Dividir por vírgulas e processar cada membro
            family_array := string_to_array(family_members_text, ',');
            family_data := '[]'::jsonb;
            
            FOREACH member_name IN ARRAY family_array
            LOOP
                member_name := trim(member_name);
                IF member_name != '' THEN
                    family_data := family_data || jsonb_build_array(
                        jsonb_build_object('name', member_name)
                    );
                END IF;
            END LOOP;
        END IF;
        
        -- Processar estacionamento se existe no metadata
        parking_spaces_text := user_metadata->>'parking_spaces';
        IF parking_spaces_text IS NOT NULL AND parking_spaces_text != '' THEN
            -- Dividir por vírgulas e processar cada espaço
            parking_array := string_to_array(parking_spaces_text, ',');
            parking_data := '[]'::jsonb;
            
            FOREACH space_info IN ARRAY parking_array
            LOOP
                space_info := trim(space_info);
                IF space_info != '' THEN
                    parking_data := parking_data || jsonb_build_array(
                        jsonb_build_object(
                            'number', space_info,
                            'type', 'Atribuído'
                        )
                    );
                END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para processar metadata quando um perfil é criado
DROP TRIGGER IF EXISTS process_resident_metadata_trigger ON profiles;
CREATE TRIGGER process_resident_metadata_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    WHEN (NEW.role = 'resident')
    EXECUTE FUNCTION process_resident_metadata();