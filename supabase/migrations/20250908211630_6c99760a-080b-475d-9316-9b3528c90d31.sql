-- Fix function search path issues by setting explicit search_path
CREATE OR REPLACE FUNCTION public.has_city_access(_user_id uuid, _city_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.viewer_city_access vca
    WHERE vca.user_id = _user_id
      AND vca.city_id = _city_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_cities(_user_id uuid)
RETURNS TABLE(city_id uuid, city_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT c.id, c.name
  FROM public.cities c
  JOIN public.viewer_city_access vca ON c.id = vca.city_id
  WHERE vca.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.create_city_viewer_user(
  _user_id uuid,
  _first_name text,
  _last_name text,
  _phone text DEFAULT NULL,
  _city_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _profile_id uuid;
  _city_id uuid;
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already has a profile',
      'code', 'USER_EXISTS'
    );
  END IF;

  -- Create profile for city viewer
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
    NULL,  -- City viewers don't belong to a specific condominium
    'city_viewer',
    _first_name,
    _last_name,
    _phone,
    true
  ) RETURNING id INTO _profile_id;

  -- Add city access permissions
  FOREACH _city_id IN ARRAY _city_ids
  LOOP
    INSERT INTO public.viewer_city_access (
      user_id,
      city_id,
      created_by
    ) VALUES (
      _user_id,
      _city_id,
      auth.uid()
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'profile_id', _profile_id,
    'message', 'City viewer created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Internal error: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_city_viewer_access(
  _user_id uuid,
  _city_ids uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _city_id uuid;
BEGIN
  -- Remove existing access
  DELETE FROM public.viewer_city_access WHERE user_id = _user_id;
  
  -- Add new access
  FOREACH _city_id IN ARRAY _city_ids
  LOOP
    INSERT INTO public.viewer_city_access (
      user_id,
      city_id,
      created_by
    ) VALUES (
      _user_id,
      _city_id,
      auth.uid()
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'City access updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Internal error: ' || SQLERRM
    );
END;
$$;