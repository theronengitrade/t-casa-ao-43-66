-- Create function to handle coordinator creation with proper error handling
CREATE OR REPLACE FUNCTION public.create_coordinator_profile(
  _user_id uuid,
  _condominium_id uuid,
  _first_name text,
  _last_name text,
  _phone text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
  _result json;
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já possui um perfil no sistema',
      'code', 'USER_ALREADY_EXISTS'
    );
  END IF;

  -- Check if condominium exists
  IF NOT EXISTS (SELECT 1 FROM public.condominiums WHERE id = _condominium_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Condomínio não encontrado',
      'code', 'CONDOMINIUM_NOT_FOUND'
    );
  END IF;

  -- Check if condominium already has a coordinator
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE condominium_id = _condominium_id AND role = 'coordinator'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Condomínio já possui um coordenador',
      'code', 'COORDINATOR_EXISTS'
    );
  END IF;

  -- Create coordinator profile
  INSERT INTO public.profiles (
    user_id,
    condominium_id,
    role,
    first_name,
    last_name,
    phone,
    must_change_password
  ) VALUES (
    _user_id,
    _condominium_id,
    'coordinator',
    _first_name,
    _last_name,
    _phone,
    true -- Force password change on first login
  ) RETURNING id INTO _profile_id;

  -- Return success with profile data
  RETURN json_build_object(
    'success', true,
    'message', 'Coordenador criado com sucesso',
    'data', json_build_object(
      'profile_id', _profile_id,
      'user_id', _user_id,
      'condominium_id', _condominium_id,
      'role', 'coordinator'
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$;

-- Create function to get condominium details with coordinator info
CREATE OR REPLACE FUNCTION public.get_condominium_with_coordinator(_condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result json;
BEGIN
  SELECT json_build_object(
    'condominium', json_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.email,
      'address', c.address,
      'phone', c.phone,
      'currency', c.currency,
      'resident_linking_code', c.resident_linking_code
    ),
    'coordinator', CASE 
      WHEN p.id IS NOT NULL THEN json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'phone', p.phone,
        'must_change_password', p.must_change_password
      )
      ELSE NULL
    END,
    'license', CASE
      WHEN l.id IS NOT NULL THEN json_build_object(
        'id', l.id,
        'status', l.status,
        'start_date', l.start_date,
        'end_date', l.end_date
      )
      ELSE NULL
    END
  ) INTO _result
  FROM public.condominiums c
  LEFT JOIN public.profiles p ON c.id = p.condominium_id AND p.role = 'coordinator'
  LEFT JOIN public.licenses l ON c.id = l.condominium_id
  WHERE c.id = _condominium_id;

  RETURN COALESCE(_result, json_build_object('error', 'Condomínio não encontrado'));
END;
$$;