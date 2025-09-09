-- Esta função será executada após criar o usuário no painel
-- Substitua USER_ID_AQUI pelo UUID real do usuário criado

CREATE OR REPLACE FUNCTION public.create_mario_super_admin()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mario_user_id UUID;
BEGIN
  -- Buscar o usuário Mario pelo email
  SELECT u.id INTO mario_user_id
  FROM auth.users u
  WHERE u.email = 'theronengitrade@gmail.com';
  
  IF mario_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário theronengitrade@gmail.com não encontrado. Crie primeiro no painel.'
    );
  END IF;
  
  -- Verificar se já existe perfil para este usuário
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = mario_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Perfil já existe para este usuário'
    );
  END IF;
  
  -- Criar perfil de super admin
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
    mario_user_id,
    NULL,
    'super_admin',
    'Mario',
    'Manuel',
    '+244933696567',
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Super administrador Mario Manuel criado com sucesso!',
    'user_id', mario_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$$;

-- Executar a função imediatamente (falhará se usuário não existir)
SELECT public.create_mario_super_admin();