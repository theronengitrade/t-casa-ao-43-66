-- Trigger types regeneration by creating a simple function
-- This will force the system to regenerate the types.ts file
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(profile_data json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT to_json(p.*) as profile_data
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$;