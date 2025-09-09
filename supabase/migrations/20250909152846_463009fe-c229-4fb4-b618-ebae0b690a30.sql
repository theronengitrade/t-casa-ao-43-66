-- Fix the create_city_viewer_user function to handle created_by properly
DROP FUNCTION IF EXISTS public.create_city_viewer_user(uuid, text, text, uuid[], text);

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
  _created_by_user uuid;
BEGIN
  -- Get the user who is creating this (should be a super admin)
  SELECT auth.uid() INTO _created_by_user;
  
  -- If auth.uid() is null (edge function context), we need to handle it differently
  IF _created_by_user IS NULL THEN
    -- In edge function context, we'll use a system identifier
    -- First check if there's a super admin user we can use as creator
    SELECT user_id INTO _created_by_user 
    FROM profiles 
    WHERE role = 'super_admin' 
    LIMIT 1;
    
    -- If no super admin found, this is an error
    IF _created_by_user IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No super admin found to assign as creator'
      );
    END IF;
  END IF;

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
      _created_by_user  -- Now properly set
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