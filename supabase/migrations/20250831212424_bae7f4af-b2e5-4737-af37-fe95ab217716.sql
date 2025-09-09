-- Criar tabela para gestão do remanescente anual
CREATE TABLE public.remanescente_anual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominium_id UUID NOT NULL,
  ano_referencia INTEGER NOT NULL,
  valor_recebido NUMERIC NOT NULL DEFAULT 0,
  valor_despesas NUMERIC NOT NULL DEFAULT 0,
  valor_remanescente NUMERIC NOT NULL DEFAULT 0,
  valor_utilizado NUMERIC NOT NULL DEFAULT 0,
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, ano_referencia)
);

-- Adicionar campo fonte_pagamento na tabela expenses
ALTER TABLE public.expenses 
ADD COLUMN fonte_pagamento TEXT NOT NULL DEFAULT 'receita_atual';

-- Adicionar constraint para fonte_pagamento
ALTER TABLE public.expenses 
ADD CONSTRAINT check_fonte_pagamento 
CHECK (fonte_pagamento IN ('receita_atual', 'remanescente'));

-- Habilitar RLS na nova tabela
ALTER TABLE public.remanescente_anual ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para remanescente_anual
CREATE POLICY "Multi-tenant access for remanescente_anual" 
ON public.remanescente_anual 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_remanescente_anual_updated_at
BEFORE UPDATE ON public.remanescente_anual
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular e processar remanescente anual
CREATE OR REPLACE FUNCTION public.processar_remanescente_anual(_condominium_id uuid, _ano integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _valor_recebido NUMERIC := 0;
  _valor_despesas NUMERIC := 0;
  _valor_remanescente NUMERIC := 0;
  _remanescente_id UUID;
BEGIN
  -- Calcular receitas do ano (pagamentos confirmados)
  SELECT COALESCE(SUM(amount), 0) INTO _valor_recebido
  FROM public.payments 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM payment_date) = _ano
    AND status = 'paid';
  
  -- Calcular despesas do ano
  SELECT COALESCE(SUM(amount), 0) INTO _valor_despesas
  FROM public.expenses 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM expense_date) = _ano;
  
  -- Calcular remanescente
  _valor_remanescente := _valor_recebido - _valor_despesas;
  
  -- Inserir ou atualizar registro
  INSERT INTO public.remanescente_anual (
    condominium_id,
    ano_referencia,
    valor_recebido,
    valor_despesas,
    valor_remanescente,
    saldo_atual
  ) VALUES (
    _condominium_id,
    _ano,
    _valor_recebido,
    _valor_despesas,
    _valor_remanescente,
    _valor_remanescente
  )
  ON CONFLICT (condominium_id, ano_referencia)
  DO UPDATE SET
    valor_recebido = EXCLUDED.valor_recebido,
    valor_despesas = EXCLUDED.valor_despesas,
    valor_remanescente = EXCLUDED.valor_remanescente,
    saldo_atual = EXCLUDED.valor_remanescente + (remanescente_anual.saldo_atual - remanescente_anual.valor_remanescente),
    updated_at = now()
  RETURNING id INTO _remanescente_id;
  
  RETURN json_build_object(
    'success', true,
    'ano', _ano,
    'valor_recebido', _valor_recebido,
    'valor_despesas', _valor_despesas,
    'valor_remanescente', _valor_remanescente,
    'id', _remanescente_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Função para obter saldo disponível total (receita atual + remanescente disponível)
CREATE OR REPLACE FUNCTION public.obter_saldo_disponivel(_condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ano_atual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  _receita_atual NUMERIC := 0;
  _despesas_atual NUMERIC := 0;
  _remanescente_total NUMERIC := 0;
  _saldo_disponivel NUMERIC := 0;
BEGIN
  -- Receita do ano atual (pagamentos confirmados)
  SELECT COALESCE(SUM(amount), 0) INTO _receita_atual
  FROM public.payments 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM payment_date) = _ano_atual
    AND status = 'paid';
  
  -- Despesas do ano atual
  SELECT COALESCE(SUM(amount), 0) INTO _despesas_atual
  FROM public.expenses 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM expense_date) = _ano_atual;
  
  -- Remanescente total disponível (soma de todos os anos anteriores)
  SELECT COALESCE(SUM(saldo_atual), 0) INTO _remanescente_total
  FROM public.remanescente_anual 
  WHERE condominium_id = _condominium_id 
    AND ano_referencia < _ano_atual;
  
  -- Saldo disponível total
  _saldo_disponivel := _receita_atual + _remanescente_total - _despesas_atual;
  
  RETURN json_build_object(
    'ano_atual', _ano_atual,
    'receita_atual', _receita_atual,
    'despesas_atual', _despesas_atual,
    'remanescente_total', _remanescente_total,
    'saldo_disponivel', _saldo_disponivel
  );
END;
$function$;