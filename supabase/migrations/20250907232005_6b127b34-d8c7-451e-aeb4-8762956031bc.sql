-- Função para remover um membro da coordenação
CREATE OR REPLACE FUNCTION public.remove_from_coordination(_coordination_staff_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _user_id uuid;
BEGIN
  -- Buscar user_id do membro da coordenação
  SELECT user_id INTO _user_id
  FROM public.coordination_staff
  WHERE id = _coordination_staff_id;
  
  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro da coordenação não encontrado');
  END IF;
  
  -- Remover coordination_staff_id do profile
  UPDATE public.profiles 
  SET coordination_staff_id = NULL,
      updated_at = now()
  WHERE user_id = _user_id;
  
  -- Remover registro da coordination_staff
  DELETE FROM public.coordination_staff 
  WHERE id = _coordination_staff_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Membro removido da coordenação com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;