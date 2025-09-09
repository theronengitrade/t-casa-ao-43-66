-- Primeira tentativa: inserir o usuário diretamente (se permitido)
-- Note: Normalmente usuários são criados via Supabase Auth API

-- Função para criar super admin diretamente 
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Gerar um UUID para o novo usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir usuário na tabela auth.users (se permitido)
  -- Nota: Isto pode não funcionar devido a restrições de segurança
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      new_email,
      invited_at,
      action_link,
      email_change,
      email_change_confirm_status,
      banned_until,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      confirmed_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'theronengitrade@gmail.com',
      crypt('Wakanda199%', gen_salt('bf')), -- Hash da password
      now(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      0,
      null,
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Mario","last_name":"Manuel"}',
      false,
      now(),
      now(),
      '+244933696567',
      null,
      null,
      null,
      null,
      now(),
      null,
      0,
      null,
      null,
      null,
      false,
      null
    );
    
    RAISE NOTICE 'Usuário criado com ID: %', new_user_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível criar usuário via SQL: %', SQLERRM;
      -- Se não conseguir criar o usuário, vamos usar um UUID fixo para demonstração
      -- O usuário terá que ser criado manualmente no painel
      new_user_id := '00000000-1111-2222-3333-444444444444';
  END;
  
  -- Criar o perfil de super admin
  BEGIN
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
      NULL,
      'super_admin',
      'Mario',
      'Manuel', 
      '+244933696567',
      NULL,
      false
    );
    
    RAISE NOTICE 'Perfil de super admin criado com sucesso para: %', new_user_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao criar perfil: %', SQLERRM;
  END;
  
END $$;