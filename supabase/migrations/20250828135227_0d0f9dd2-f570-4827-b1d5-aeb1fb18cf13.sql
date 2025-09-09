-- Criar o perfil diretamente, assumindo que o usuário será criado manualmente
-- Primeiro, vamos criar um UUID fixo para o usuário Mario Manuel

-- Inserir o perfil de super admin diretamente
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
  '550e8400-e29b-41d4-a716-446655440000', -- UUID temporário - será substituído quando o usuário real for criado
  NULL,
  'super_admin',
  'Mario',
  'Manuel',
  '+244933696567', 
  NULL,
  false
) ON CONFLICT (user_id) DO NOTHING;

-- Criar uma função para atualizar o perfil quando o usuário real for criado
CREATE OR REPLACE FUNCTION public.update_super_admin_profile(real_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar o perfil existente com o ID real do usuário
  UPDATE public.profiles 
  SET user_id = real_user_id
  WHERE first_name = 'Mario' 
    AND last_name = 'Manuel' 
    AND role = 'super_admin'
    AND user_id = '550e8400-e29b-41d4-a716-446655440000';
    
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil de super admin atualizado com sucesso',
      'user_id', real_user_id
    );
  ELSE 
    RETURN json_build_object(
      'success', false,
      'message', 'Perfil não encontrado para atualização'
    );
  END IF;
END;
$$;