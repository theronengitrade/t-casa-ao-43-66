-- =====================================================
-- CORREÇÃO CRÍTICA: SINCRONIZAÇÃO TOTAL DOS CÓDIGOS DE LIGAÇÃO
-- =====================================================

-- 1. Corrigir função de geração de código para usar SEMPRE minúsculas (consistente com DB)
CREATE OR REPLACE FUNCTION public.generate_linking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Gera código de 16 caracteres hexadecimais em MINÚSCULAS (consistente com padrão DB)
  RETURN encode(extensions.gen_random_bytes(8), 'hex');
END;
$$;

-- 2. Função melhorada de regeneração com validação tripla
CREATE OR REPLACE FUNCTION public.regenerate_linking_code(_condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_code text;
  _old_code text;
  _attempts integer := 0;
  _max_attempts integer := 10;
BEGIN
  -- Obter código antigo para auditoria
  SELECT resident_linking_code INTO _old_code
  FROM public.condominiums 
  WHERE id = _condominium_id;
  
  IF _old_code IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Condomínio não encontrado'
    );
  END IF;
  
  -- Gerar novo código único com verificação de colisão
  LOOP
    _attempts := _attempts + 1;
    
    -- Gerar novo código usando função centralizada
    SELECT generate_linking_code() INTO _new_code;
    
    -- Verificar se o código já existe (deve ser único)
    IF NOT EXISTS (SELECT 1 FROM public.condominiums WHERE resident_linking_code = _new_code) THEN
      EXIT; -- Código único encontrado
    END IF;
    
    -- Evitar loop infinito
    IF _attempts >= _max_attempts THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Não foi possível gerar código único após ' || _max_attempts || ' tentativas'
      );
    END IF;
  END LOOP;
  
  -- Atualizar código com validação final
  UPDATE public.condominiums 
  SET resident_linking_code = _new_code,
      updated_at = now()
  WHERE id = _condominium_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Falha ao atualizar código no banco de dados'
    );
  END IF;
  
  -- Log da operação para auditoria
  RAISE LOG 'LINKING_CODE_REGENERATED: condominium_id=%, old_code=%, new_code=%, attempts=%', 
    _condominium_id, _old_code, _new_code, _attempts;
  
  RETURN json_build_object(
    'success', true,
    'old_code', _old_code,
    'new_code', _new_code,
    'attempts', _attempts,
    'message', 'Código regenerado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ERROR_REGENERATING_CODE: condominium_id=%, error=%', _condominium_id, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$;

-- 3. Função de validação super robusta com múltiplas verificações
CREATE OR REPLACE FUNCTION public.validate_linking_code_and_apartment(_linking_code text, _apartment_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _condominium_id uuid;
  _condominium_name text;
  _existing_resident_count integer;
  _normalized_code text;
  _normalized_apartment text;
  _validation_timestamp timestamp := now();
BEGIN
  -- Log detalhado da tentativa de validação
  RAISE LOG 'VALIDATION_START: timestamp=%, code=%, apartment=%', 
    _validation_timestamp, _linking_code, _apartment_number;
  
  -- Normalizar e validar entrada
  _normalized_code := TRIM(LOWER(_linking_code));
  _normalized_apartment := TRIM(UPPER(_apartment_number));
  
  -- 1. VALIDAÇÃO: Código não pode estar vazio
  IF _normalized_code IS NULL OR _normalized_code = '' THEN
    RAISE LOG 'VALIDATION_FAILED: empty_code, timestamp=%', _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação não pode estar vazio',
      'code', 'EMPTY_LINKING_CODE'
    );
  END IF;
  
  -- 2. VALIDAÇÃO: Formato do código (16 caracteres hexadecimais)
  IF NOT is_valid_linking_code_format(_normalized_code) THEN
    RAISE LOG 'VALIDATION_FAILED: invalid_format, code=%, timestamp=%', 
      _normalized_code, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Formato de código inválido. Deve conter 16 caracteres hexadecimais',
      'code', 'INVALID_FORMAT'
    );
  END IF;
  
  -- 3. VALIDAÇÃO: Apartamento não pode estar vazio
  IF _normalized_apartment IS NULL OR _normalized_apartment = '' THEN
    RAISE LOG 'VALIDATION_FAILED: empty_apartment, timestamp=%', _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Número do apartamento é obrigatório',
      'code', 'EMPTY_APARTMENT'
    );
  END IF;
  
  -- 4. VALIDAÇÃO CRÍTICA: Buscar condomínio por código (case-insensitive, EXATO)
  SELECT id, name INTO _condominium_id, _condominium_name
  FROM public.condominiums 
  WHERE LOWER(TRIM(resident_linking_code)) = _normalized_code;
  
  -- 5. VALIDAÇÃO: Código deve existir
  IF _condominium_id IS NULL THEN
    RAISE LOG 'VALIDATION_FAILED: invalid_code, code=%, timestamp=%', 
      _normalized_code, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação inválido ou expirado',
      'code', 'INVALID_LINKING_CODE'
    );
  END IF;
  
  -- 6. VALIDAÇÃO CRÍTICA: Apartamento não pode estar ocupado
  SELECT COUNT(*) INTO _existing_resident_count
  FROM public.residents 
  WHERE condominium_id = _condominium_id 
  AND UPPER(TRIM(apartment_number)) = _normalized_apartment;
  
  IF _existing_resident_count > 0 THEN
    RAISE LOG 'VALIDATION_FAILED: apartment_occupied, condominium=%, apartment=%, count=%, timestamp=%', 
      _condominium_name, _normalized_apartment, _existing_resident_count, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Apartamento ' || _normalized_apartment || ' já está ocupado por outro residente',
      'code', 'APARTMENT_OCCUPIED'
    );
  END IF;
  
  -- 7. SUCESSO: Todas as validações passaram
  RAISE LOG 'VALIDATION_SUCCESS: condominium=% (%), apartment=%, timestamp=%', 
    _condominium_name, _condominium_id, _normalized_apartment, _validation_timestamp;
    
  RETURN json_build_object(
    'success', true,
    'condominium_id', _condominium_id,
    'condominium_name', _condominium_name,
    'normalized_code', _normalized_code,
    'normalized_apartment', _normalized_apartment,
    'validation_timestamp', _validation_timestamp,
    'message', 'Código válido e apartamento disponível'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'VALIDATION_ERROR: code=%, apartment=%, error=%, timestamp=%', 
      _linking_code, _apartment_number, SQLERRM, _validation_timestamp;
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno na validação: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$;

-- 4. Garantir que todos os códigos existentes estão em minúsculas
UPDATE public.condominiums 
SET resident_linking_code = LOWER(resident_linking_code)
WHERE resident_linking_code != LOWER(resident_linking_code);

-- 5. Adicionar constraint para garantir formato correto em novos registros
ALTER TABLE public.condominiums 
DROP CONSTRAINT IF EXISTS check_linking_code_format;

ALTER TABLE public.condominiums 
ADD CONSTRAINT check_linking_code_format 
CHECK (resident_linking_code ~ '^[a-f0-9]{16}$');

-- 6. Comentários para documentação
COMMENT ON FUNCTION public.generate_linking_code() IS 
'Gera código de ligação de 16 caracteres hexadecimais em minúsculas para garantir consistência';

COMMENT ON FUNCTION public.regenerate_linking_code(uuid) IS 
'Regenera código de ligação com verificação de unicidade e múltiplas tentativas';

COMMENT ON FUNCTION public.validate_linking_code_and_apartment(text, text) IS 
'Validação robusta de código de ligação e disponibilidade de apartamento com logs detalhados';

-- 7. Log de finalização
DO $$
BEGIN
  RAISE LOG 'MIGRATION_COMPLETED: linking_code_synchronization_fix applied at %', now();
END
$$;