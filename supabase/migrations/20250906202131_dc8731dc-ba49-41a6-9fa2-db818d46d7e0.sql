-- 1. Adicionar campo status na tabela expenses
ALTER TABLE public.expenses 
ADD COLUMN status TEXT NOT NULL DEFAULT 'aprovada' 
CHECK (status IN ('aprovada', 'pendente', 'em_aprovacao'));

-- 2. Atualizar todas as despesas existentes para 'aprovada'
UPDATE public.expenses SET status = 'aprovada' WHERE status IS NULL;

-- 3. Criar função para validar saldo disponível
CREATE OR REPLACE FUNCTION public.validar_saldo_disponivel(
  _condominium_id uuid,
  _valor numeric,
  _fonte_pagamento text DEFAULT 'receita_atual'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _ano_atual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  _receita_atual NUMERIC := 0;
  _despesas_aprovadas NUMERIC := 0;
  _remanescente_total NUMERIC := 0;
  _saldo_disponivel NUMERIC := 0;
  _saldo_fonte NUMERIC := 0;
BEGIN
  -- Calcular receita do ano atual (pagamentos confirmados)
  SELECT COALESCE(SUM(amount), 0) INTO _receita_atual
  FROM public.payments 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM payment_date) = _ano_atual
    AND status = 'paid';
  
  -- Calcular despesas aprovadas do ano atual
  SELECT COALESCE(SUM(amount), 0) INTO _despesas_aprovadas
  FROM public.expenses 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM expense_date) = _ano_atual
    AND status = 'aprovada';
  
  -- Calcular remanescente total disponível
  SELECT COALESCE(SUM(saldo_atual), 0) INTO _remanescente_total
  FROM public.remanescente_anual 
  WHERE condominium_id = _condominium_id 
    AND ano_referencia < _ano_atual;
  
  -- Determinar saldo da fonte específica
  IF _fonte_pagamento = 'receita_atual' THEN
    _saldo_fonte := _receita_atual - _despesas_aprovadas;
  ELSE
    _saldo_fonte := _remanescente_total;
  END IF;
  
  -- Saldo total disponível
  _saldo_disponivel := _receita_atual + _remanescente_total - _despesas_aprovadas;
  
  -- Validar se há saldo suficiente
  IF _valor > _saldo_fonte THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Saldo insuficiente na fonte selecionada',
      'saldo_fonte', _saldo_fonte,
      'saldo_total', _saldo_disponivel,
      'valor_solicitado', _valor,
      'fonte_pagamento', _fonte_pagamento
    );
  END IF;
  
  RETURN json_build_object(
    'sucesso', true,
    'saldo_fonte', _saldo_fonte,
    'saldo_total', _saldo_disponivel,
    'valor_solicitado', _valor,
    'fonte_pagamento', _fonte_pagamento,
    'receita_atual', _receita_atual,
    'despesas_aprovadas', _despesas_aprovadas,
    'remanescente_total', _remanescente_total
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Erro interno na validação: ' || SQLERRM
    );
END;
$$;

-- 4. Criar função para criar despesa com validação
CREATE OR REPLACE FUNCTION public.criar_despesa_com_validacao(
  _condominium_id uuid,
  _category text,
  _description text,
  _amount numeric,
  _expense_date date,
  _fonte_pagamento text DEFAULT 'receita_atual',
  _service_provider_id uuid DEFAULT NULL,
  _created_by uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _validacao json;
  _expense_id uuid;
  _status text := 'aprovada';
BEGIN
  -- 1. Validar saldo disponível
  SELECT validar_saldo_disponivel(_condominium_id, _amount, _fonte_pagamento) INTO _validacao;
  
  -- 2. Se não há saldo suficiente, criar como pendente
  IF NOT (_validacao->>'sucesso')::boolean THEN
    _status := 'pendente';
    
    -- Log da criação como pendente
    RAISE LOG 'DESPESA_PENDENTE: amount=%, saldo_fonte=%, condominium=%', 
      _amount, _validacao->>'saldo_fonte', _condominium_id;
  END IF;
  
  -- 3. Inserir despesa com status apropriado
  INSERT INTO public.expenses (
    condominium_id,
    category,
    description,
    amount,
    expense_date,
    fonte_pagamento,
    service_provider_id,
    created_by,
    status
  ) VALUES (
    _condominium_id,
    _category,
    _description,
    _amount,
    _expense_date,
    _fonte_pagamento,
    _service_provider_id,
    _created_by,
    _status
  ) RETURNING id INTO _expense_id;
  
  -- 4. Se foi usado remanescente e aprovada, atualizar utilização
  IF _status = 'aprovada' AND _fonte_pagamento = 'remanescente' THEN
    PERFORM atualizar_utilizacao_remanescente(
      _condominium_id, 
      EXTRACT(YEAR FROM CURRENT_DATE)::integer - 1, 
      _amount
    );
  END IF;
  
  -- 5. Retornar resultado
  RETURN json_build_object(
    'sucesso', true,
    'expense_id', _expense_id,
    'status', _status,
    'mensagem', CASE 
      WHEN _status = 'aprovada' THEN 'Despesa registrada com sucesso'
      ELSE 'Despesa criada como PENDENTE devido a saldo insuficiente'
    END,
    'validacao', _validacao
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Erro ao criar despesa: ' || SQLERRM
    );
END;
$$;

-- 5. Criar função para aprovar despesa pendente
CREATE OR REPLACE FUNCTION public.aprovar_despesa_pendente(
  _expense_id uuid,
  _condominium_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _expense RECORD;
  _validacao json;
BEGIN
  -- 1. Buscar despesa
  SELECT * INTO _expense
  FROM public.expenses 
  WHERE id = _expense_id 
    AND condominium_id = _condominium_id 
    AND status IN ('pendente', 'em_aprovacao');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Despesa não encontrada ou já aprovada'
    );
  END IF;
  
  -- 2. Validar saldo atual
  SELECT validar_saldo_disponivel(_condominium_id, _expense.amount, _expense.fonte_pagamento) INTO _validacao;
  
  IF NOT (_validacao->>'sucesso')::boolean THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Saldo ainda insuficiente para aprovar esta despesa',
      'validacao', _validacao
    );
  END IF;
  
  -- 3. Aprovar despesa
  UPDATE public.expenses 
  SET status = 'aprovada', updated_at = now()
  WHERE id = _expense_id;
  
  -- 4. Se foi remanescente, atualizar utilização
  IF _expense.fonte_pagamento = 'remanescente' THEN
    PERFORM atualizar_utilizacao_remanescente(
      _condominium_id,
      EXTRACT(YEAR FROM CURRENT_DATE)::integer - 1,
      _expense.amount
    );
  END IF;
  
  RETURN json_build_object(
    'sucesso', true,
    'mensagem', 'Despesa aprovada com sucesso',
    'validacao', _validacao
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', 'Erro ao aprovar despesa: ' || SQLERRM
    );
END;
$$;

-- 6. Atualizar função obter_saldo_disponivel para considerar apenas despesas aprovadas
CREATE OR REPLACE FUNCTION public.obter_saldo_disponivel(_condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ano_atual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  _receita_atual NUMERIC := 0;
  _despesas_aprovadas NUMERIC := 0;
  _despesas_pendentes NUMERIC := 0;
  _remanescente_total NUMERIC := 0;
  _saldo_disponivel NUMERIC := 0;
BEGIN
  -- Receita do ano atual (pagamentos confirmados)
  SELECT COALESCE(SUM(amount), 0) INTO _receita_atual
  FROM public.payments 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM payment_date) = _ano_atual
    AND status = 'paid';
  
  -- Despesas APROVADAS do ano atual
  SELECT COALESCE(SUM(amount), 0) INTO _despesas_aprovadas
  FROM public.expenses 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM expense_date) = _ano_atual
    AND status = 'aprovada';
  
  -- Despesas PENDENTES do ano atual (para informação)
  SELECT COALESCE(SUM(amount), 0) INTO _despesas_pendentes
  FROM public.expenses 
  WHERE condominium_id = _condominium_id 
    AND EXTRACT(YEAR FROM expense_date) = _ano_atual
    AND status IN ('pendente', 'em_aprovacao');
  
  -- Remanescente total disponível (soma de todos os anos anteriores)
  SELECT COALESCE(SUM(saldo_atual), 0) INTO _remanescente_total
  FROM public.remanescente_anual 
  WHERE condominium_id = _condominium_id 
    AND ano_referencia < _ano_atual;
  
  -- Saldo disponível real (apenas despesas aprovadas são deduzidas)
  _saldo_disponivel := _receita_atual + _remanescente_total - _despesas_aprovadas;
  
  RETURN json_build_object(
    'ano_atual', _ano_atual,
    'receita_atual', _receita_atual,
    'despesas_aprovadas', _despesas_aprovadas,
    'despesas_pendentes', _despesas_pendentes,
    'remanescente_total', _remanescente_total,
    'saldo_disponivel', _saldo_disponivel,
    'saldo_receita_atual', _receita_atual - _despesas_aprovadas,
    'pode_gastar_receita', _receita_atual - _despesas_aprovadas,
    'pode_gastar_remanescente', _remanescente_total
  );
END;
$$;