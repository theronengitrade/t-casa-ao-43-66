-- Fix function search path issues by adding SECURITY DEFINER and search_path
-- This addresses the security warning about mutable search paths

-- Drop and recreate functions with proper security settings
DROP FUNCTION IF EXISTS public.generate_linking_code();
DROP FUNCTION IF EXISTS public.is_valid_linking_code_format(text);

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.generate_linking_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Gera código de 16 caracteres hexadecimais em MINÚSCULAS (consistente com padrão DB)
  RETURN encode(extensions.gen_random_bytes(8), 'hex');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_linking_code_format(_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Código deve ter exatamente 16 caracteres hexadecimais
  RETURN _code ~ '^[a-fA-F0-9]{16}$';
END;
$function$;