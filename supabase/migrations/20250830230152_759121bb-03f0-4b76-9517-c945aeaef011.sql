-- CRIAR TRIGGER SIMPLES PARA TESTAR PERMISSÕES
CREATE OR REPLACE FUNCTION public.simple_test_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE LOG 'SIMPLE_TEST: New user created with ID: %', NEW.id;
    RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tentar criar trigger na tabela auth.users
DO $$
BEGIN
    -- Verificar se podemos criar triggers na tabela auth.users
    BEGIN
        CREATE TRIGGER test_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.simple_test_trigger();
            
        RAISE LOG 'SUCCESS: Trigger created on auth.users table';
        
        -- Se funcionou, remover o teste e criar o real
        DROP TRIGGER test_auth_user_created ON auth.users;
        
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
            
        RAISE LOG 'SUCCESS: Real trigger created on auth.users table';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'ERROR: Cannot create trigger on auth.users: %', SQLERRM;
    END;
END $$;