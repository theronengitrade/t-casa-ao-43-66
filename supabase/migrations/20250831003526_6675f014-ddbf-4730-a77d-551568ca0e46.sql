-- SOLUÇÃO DEFINITIVA: Criar o trigger que está faltando
-- Este trigger é CRÍTICO para o funcionamento do registro de usuários

-- Primeiro, verificar se o trigger já existe e removê-lo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger que executa handle_new_user quando um usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Log para confirmar que o trigger foi criado
DO $$
BEGIN
  RAISE LOG 'TRIGGER_CREATED: on_auth_user_created trigger has been successfully created and will now process new user registrations automatically.';
END $$;