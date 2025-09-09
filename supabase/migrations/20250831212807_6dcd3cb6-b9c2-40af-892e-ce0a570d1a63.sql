-- Criar função para atualizar utilização do remanescente
CREATE OR REPLACE FUNCTION public.atualizar_utilizacao_remanescente(_condominium_id uuid, _ano_origem integer, _valor numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.remanescente_anual 
  SET 
    valor_utilizado = valor_utilizado + _valor,
    saldo_atual = saldo_atual - _valor,
    updated_at = now()
  WHERE condominium_id = _condominium_id 
    AND ano_referencia = _ano_origem;
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Remanescente não encontrado para o ano especificado'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilização atualizada com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;