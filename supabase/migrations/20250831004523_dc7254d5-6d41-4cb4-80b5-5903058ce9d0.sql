-- CRÍTICO: Recriar o trigger que estava funcionando nos registros exitosos de 28/08/2025
-- O trigger on_auth_user_created está faltando e precisa ser recriado

-- Primeiro, verificar se há triggers antigos e removê-los para evitar conflitos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS simple_test_trigger ON auth.users;

-- Recriar o trigger ESSENCIAL que processa novos usuários automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log de confirmação  
RAISE LOG 'TRIGGER_RECREATED: on_auth_user_created trigger recreated successfully';