-- Função para sincronizar apartment_count baseado nos apartamentos realmente ocupados
CREATE OR REPLACE FUNCTION sync_condominium_apartment_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _condominium RECORD;
  _updated_count INTEGER := 0;
  _real_apartment_count INTEGER;
BEGIN
  -- Percorrer todos os condomínios
  FOR _condominium IN 
    SELECT c.id, c.name, c.apartment_count,
           (SELECT COUNT(DISTINCT r.apartment_number) 
            FROM residents r 
            WHERE r.condominium_id = c.id) as real_apartments
    FROM condominiums c
  LOOP
    _real_apartment_count := COALESCE(_condominium.real_apartments, 0);
    
    -- Só atualizar se houver apartamentos registrados e o valor atual estiver errado
    IF _real_apartment_count > 0 AND _condominium.apartment_count != _real_apartment_count THEN
      UPDATE condominiums 
      SET apartment_count = _real_apartment_count,
          updated_at = now()
      WHERE id = _condominium.id;
      
      _updated_count := _updated_count + 1;
      
      RAISE LOG 'SYNC_APARTMENTS: condominium=% (%), old_count=%, new_count=%', 
        _condominium.name, _condominium.id, _condominium.apartment_count, _real_apartment_count;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'updated_condominiums', _updated_count,
    'message', 'Sincronização concluída com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro na sincronização: ' || SQLERRM
    );
END;
$function$;

-- Executar a sincronização imediatamente
SELECT sync_condominium_apartment_counts();