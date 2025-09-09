-- Criar function de teste simples para verificar se triggers funcionam
CREATE OR REPLACE FUNCTION public.simple_test_trigger()
RETURNS TRIGGER AS $$
BEGIN
    RAISE LOG 'SIMPLE_TEST: New user created with ID: %', NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger de teste simples
CREATE TRIGGER simple_test_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION simple_test_trigger();