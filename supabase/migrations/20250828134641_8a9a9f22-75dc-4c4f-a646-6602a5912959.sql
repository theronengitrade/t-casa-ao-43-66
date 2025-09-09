-- Create a function to register a super admin
CREATE OR REPLACE FUNCTION public.create_super_admin(
  user_email TEXT,
  user_password TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- This function will help create super admin profiles
  -- Note: The actual user creation must be done through Supabase Auth
  -- This function is for creating the profile after user exists
  
  -- Check if user already exists by email in profiles
  SELECT p.user_id INTO new_user_id 
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  WHERE u.email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já existe com este email'
    );
  END IF;
  
  -- Get user_id by email from auth.users
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado. Crie primeiro no painel de autenticação.'
    );
  END IF;
  
  -- Create super admin profile
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
    new_user_id,
    NULL, -- Super admin não pertence a um condomínio específico
    'super_admin',
    first_name,
    last_name,
    phone,
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Super administrador criado com sucesso',
    'user_id', new_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro ao criar super admin: ' || SQLERRM
    );
END;
$$;

-- Alternative: Direct insert function (simpler approach)
CREATE OR REPLACE FUNCTION public.insert_super_admin_profile(
  _user_id UUID,
  _first_name TEXT,
  _last_name TEXT,
  _phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert super admin profile directly
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
    _user_id,
    NULL,
    'super_admin',
    _first_name,
    _last_name,
    _phone,
    NULL,
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Perfil de super administrador criado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erro: ' || SQLERRM
    );
END;
$$;