-- Fix search_path security warning for create_city_viewer_user function
CREATE OR REPLACE FUNCTION public.create_city_viewer_user(
  _user_id uuid,
  _first_name text,
  _last_name text,
  _city_ids uuid[],
  _phone text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _profile_id uuid;
  _city_id uuid;
BEGIN
  -- Create profile for city viewer
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
    NULL, -- City viewers don't belong to a specific condominium
    'city_viewer',
    _first_name,
    _last_name,
    _phone,
    NULL,
    false
  ) RETURNING id INTO _profile_id;

  -- Grant access to selected cities
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
    'cities_granted', array_length(_city_ids, 1)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;