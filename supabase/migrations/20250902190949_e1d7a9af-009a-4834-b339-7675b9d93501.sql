-- Criar tabela para QR codes de visitantes
CREATE TABLE public.visitor_qrcodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL,
  condominium_id UUID NOT NULL,
  created_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  entry_registered_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_visitor_qrcodes_token ON public.visitor_qrcodes(token);
CREATE INDEX idx_visitor_qrcodes_visitor_id ON public.visitor_qrcodes(visitor_id);
CREATE INDEX idx_visitor_qrcodes_condominium_id ON public.visitor_qrcodes(condominium_id);
CREATE INDEX idx_visitor_qrcodes_expires_at ON public.visitor_qrcodes(expires_at);

-- Habilitar RLS
ALTER TABLE public.visitor_qrcodes ENABLE ROW LEVEL SECURITY;

-- Política para acesso multi-tenant
CREATE POLICY "Multi-tenant access for visitor_qrcodes" 
ON public.visitor_qrcodes 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Função para gerar token único
CREATE OR REPLACE FUNCTION public.generate_visitor_qrcode_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _token TEXT;
  _attempts INTEGER := 0;
  _max_attempts INTEGER := 10;
BEGIN
  LOOP
    _attempts := _attempts + 1;
    
    -- Gerar token único de 32 caracteres
    _token := encode(extensions.gen_random_bytes(24), 'base64');
    _token := replace(_token, '/', '_');
    _token := replace(_token, '+', '-');
    _token := replace(_token, '=', '');
    
    -- Verificar se é único
    IF NOT EXISTS (SELECT 1 FROM public.visitor_qrcodes WHERE token = _token) THEN
      RETURN _token;
    END IF;
    
    -- Prevenir loop infinito
    IF _attempts >= _max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar token único após % tentativas', _max_attempts;
    END IF;
  END LOOP;
END;
$function$;

-- Função para validar e processar QR code
CREATE OR REPLACE FUNCTION public.validate_and_process_visitor_qrcode(_token TEXT, _scanner_condominium_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _qrcode_record RECORD;
  _visitor_record RECORD;
  _current_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Buscar QR code pelo token
  SELECT qr.*, v.name as visitor_name, v.phone as visitor_phone, 
         v.document_number as visitor_document, v.purpose as visit_purpose,
         r.apartment_number, p.first_name || ' ' || p.last_name as resident_name
  INTO _qrcode_record
  FROM public.visitor_qrcodes qr
  JOIN public.visitors v ON qr.visitor_id = v.id
  JOIN public.residents r ON v.resident_id = r.id
  JOIN public.profiles p ON r.profile_id = p.id
  WHERE qr.token = _token;
  
  -- Verificar se o token existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QR Code inválido ou não encontrado',
      'code', 'INVALID_TOKEN'
    );
  END IF;
  
  -- Verificar se pertence ao mesmo condomínio
  IF _qrcode_record.condominium_id != _scanner_condominium_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QR Code não pertence a este condomínio',
      'code', 'WRONG_CONDOMINIUM'
    );
  END IF;
  
  -- Verificar se já foi usado
  IF _qrcode_record.used_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QR Code já foi utilizado em ' || to_char(_qrcode_record.used_at, 'DD/MM/YYYY às HH24:MI'),
      'code', 'ALREADY_USED'
    );
  END IF;
  
  -- Verificar se expirou
  IF _qrcode_record.expires_at < _current_time THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QR Code expirado em ' || to_char(_qrcode_record.expires_at, 'DD/MM/YYYY às HH24:MI'),
      'code', 'EXPIRED'
    );
  END IF;
  
  -- Marcar como usado
  UPDATE public.visitor_qrcodes 
  SET used_at = _current_time,
      entry_registered_at = _current_time,
      updated_at = _current_time
  WHERE id = _qrcode_record.id;
  
  -- Retornar sucesso com dados do visitante
  RETURN json_build_object(
    'success', true,
    'visitor', json_build_object(
      'id', _qrcode_record.visitor_id,
      'name', _qrcode_record.visitor_name,
      'phone', _qrcode_record.visitor_phone,
      'document_number', _qrcode_record.visitor_document,
      'purpose', _qrcode_record.visit_purpose,
      'apartment_number', _qrcode_record.apartment_number,
      'resident_name', _qrcode_record.resident_name,
      'entry_time', _current_time
    ),
    'qrcode', json_build_object(
      'id', _qrcode_record.id,
      'created_at', _qrcode_record.created_at,
      'expires_at', _qrcode_record.expires_at,
      'used_at', _current_time
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM,
      'code', 'INTERNAL_ERROR'
    );
END;
$function$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_visitor_qrcodes_updated_at
  BEFORE UPDATE ON public.visitor_qrcodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.visitor_qrcodes IS 'QR codes temporários para check-in de visitantes';
COMMENT ON COLUMN public.visitor_qrcodes.token IS 'Token único para identificação do QR code';
COMMENT ON COLUMN public.visitor_qrcodes.expires_at IS 'Data e hora de expiração do QR code';
COMMENT ON COLUMN public.visitor_qrcodes.used_at IS 'Data e hora em que o QR code foi utilizado';
COMMENT ON COLUMN public.visitor_qrcodes.entry_registered_at IS 'Data e hora em que a entrada foi registrada';