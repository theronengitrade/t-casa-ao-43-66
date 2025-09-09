-- Criar função centralizada para gerar códigos de ligação consistentes
CREATE OR REPLACE FUNCTION public.generate_linking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Gera código de 16 caracteres hexadecimais em minúsculo (consistente com gen_random_bytes)
  RETURN encode(extensions.gen_random_bytes(8), 'hex');
END;
$$;

-- Função para validar formato de código de ligação
CREATE OR REPLACE FUNCTION public.is_valid_linking_code_format(_code text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Código deve ter exatamente 16 caracteres hexadecimais
  RETURN _code ~ '^[a-fA-F0-9]{16}$';
END;
$$;

-- Função melhorada para regenerar código de ligação
CREATE OR REPLACE FUNCTION public.regenerate_linking_code(_condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _new_code text;
  _old_code text;
BEGIN
  -- Gerar novo código usando a função centralizada
  SELECT generate_linking_code() INTO _new_code;
  
  -- Verificar se o código já existe (muito improvável, mas melhor ser seguro)
  WHILE EXISTS (SELECT 1 FROM public.condominiums WHERE resident_linking_code = _new_code) LOOP
    SELECT generate_linking_code() INTO _new_code;
  END LOOP;
  
  -- Obter código antigo para auditoria
  SELECT resident_linking_code INTO _old_code
  FROM public.condominiums 
  WHERE id = _condominium_id;
  
  -- Atualizar código
  UPDATE public.condominiums 
  SET resident_linking_code = _new_code,
      updated_at = now()
  WHERE id = _condominium_id;
  
  -- Log da operação
  RAISE LOG 'Linking code regenerated for condominium %: % -> %', 
    _condominium_id, _old_code, _new_code;
  
  RETURN json_build_object(
    'success', true,
    'old_code', _old_code,
    'new_code', _new_code,
    'message', 'Código regenerado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro ao regenerar código: ' || SQLERRM
    );
END;
$$;

-- Melhorar função de validação existente para ser mais robusta
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
BEGIN
  -- Log da tentativa de validação
  RAISE LOG 'Validating linking code: % for apartment: %', _linking_code, _apartment_number;
  
  -- Normalizar e validar entrada
  _normalized_code := TRIM(LOWER(_linking_code));
  _normalized_apartment := TRIM(UPPER(_apartment_number));
  
  -- Validar se o código não está vazio
  IF _normalized_code IS NULL OR _normalized_code = '' THEN
    RAISE LOG 'Empty linking code provided';
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação não pode estar vazio',
      'code', 'EMPTY_LINKING_CODE'
    );
  END IF;
  
  -- Validar formato do código
  IF NOT is_valid_linking_code_format(_normalized_code) THEN
    RAISE LOG 'Invalid linking code format: %', _normalized_code;
    RETURN json_build_object(
      'success', false,
      'error', 'Formato de código inválido. Deve conter 16 caracteres hexadecimais',
      'code', 'INVALID_FORMAT'
    );
  END IF;
  
  -- Validar se o apartamento não está vazio
  IF _normalized_apartment IS NULL OR _normalized_apartment = '' THEN
    RAISE LOG 'Empty apartment number provided';
    RETURN json_build_object(
      'success', false,
      'error', 'Número do apartamento é obrigatório',
      'code', 'EMPTY_APARTMENT'
    );
  END IF;
  
  -- Buscar condomínio por código de ligação (case-insensitive)
  SELECT id, name INTO _condominium_id, _condominium_name
  FROM public.condominiums 
  WHERE LOWER(resident_linking_code) = _normalized_code;
  
  -- Verificar se o código é válido
  IF _condominium_id IS NULL THEN
    RAISE LOG 'Invalid linking code: %', _normalized_code;
    RETURN json_build_object(
      'success', false,
      'error', 'Código de ligação inválido ou expirado',
      'code', 'INVALID_LINKING_CODE'
    );
  END IF;
  
  -- Verificar se o apartamento já está ocupado
  SELECT COUNT(*) INTO _existing_resident_count
  FROM public.residents 
  WHERE condominium_id = _condominium_id 
  AND UPPER(TRIM(apartment_number)) = _normalized_apartment;
  
  IF _existing_resident_count > 0 THEN
    RAISE LOG 'Apartment % already occupied in condominium %', _normalized_apartment, _condominium_name;
    RETURN json_build_object(
      'success', false,
      'error', 'Apartamento já está ocupado por outro residente',
      'code', 'APARTMENT_OCCUPIED'
    );
  END IF;
  
  -- Sucesso - código válido e apartamento disponível
  RAISE LOG 'Validation successful for linking code: % apartment: % condominium: %', 
    _normalized_code, _normalized_apartment, _condominium_name;
    
  RETURN json_build_object(
    'success', true,
    'condominium_id', _condominium_id,
    'condominium_name', _condominium_name,
    'normalized_code', _normalized_code,
    'normalized_apartment', _normalized_apartment,
    'message', 'Código válido e apartamento disponível'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in validate_linking_code_and_apartment: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno na validação: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$$;