-- ÚLTIMA TENTATIVA: VERIFICAR SE TRIGGER REALMENTE FUNCIONA
-- Primeiro verificar se podemos criar triggers na auth schema
DO $$
DECLARE
    trigger_exists BOOLEAN := false;
BEGIN
    -- Verificar se o trigger existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND trigger_schema = 'auth'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE LOG 'TRIGGER_CHECK: Trigger on_auth_user_created EXISTS in auth.users';
    ELSE
        RAISE LOG 'TRIGGER_CHECK: Trigger on_auth_user_created DOES NOT EXIST in auth.users';
        
        -- Tentar criar novamente com diferentes abordagens
        BEGIN
            CREATE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW
                EXECUTE FUNCTION public.handle_new_user();
            RAISE LOG 'TRIGGER_CREATE: Successfully created trigger on auth.users';
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'TRIGGER_CREATE: Failed to create trigger on auth.users: %', SQLERRM;
        END;
    END IF;
END $$;

-- Verificar todos os triggers do sistema
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table, trigger_schema 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%auth%' OR trigger_name LIKE '%user%'
    LOOP
        RAISE LOG 'EXISTING_TRIGGER: % on %.%', 
            trigger_record.trigger_name, 
            trigger_record.trigger_schema, 
            trigger_record.event_object_table;
    END LOOP;
END $$;