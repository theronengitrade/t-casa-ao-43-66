-- Fix the obter_saldo_disponivel function to correctly calculate current year expenses
CREATE OR REPLACE FUNCTION obter_saldo_disponivel(_condominium_id UUID)
RETURNS JSON AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    receita_result NUMERIC := 0;
    despesas_aprovadas_result NUMERIC := 0;
    despesas_pendentes_result NUMERIC := 0;
    remanescente_result NUMERIC := 0;
    saldo_result NUMERIC := 0;
BEGIN
    -- 1. Calculate current year revenue (approved payments)
    SELECT COALESCE(SUM(amount), 0) INTO receita_result
    FROM payments 
    WHERE condominium_id = _condominium_id 
      AND status = 'paid'
      AND EXTRACT(YEAR FROM COALESCE(payment_date, due_date)) = current_year;
    
    -- 2. Calculate approved expenses for current year
    SELECT COALESCE(SUM(amount), 0) INTO despesas_aprovadas_result
    FROM expenses 
    WHERE condominium_id = _condominium_id 
      AND status = 'aprovada'
      AND EXTRACT(YEAR FROM expense_date) = current_year;
    
    -- 3. Calculate pending expenses for current year
    SELECT COALESCE(SUM(amount), 0) INTO despesas_pendentes_result
    FROM expenses 
    WHERE condominium_id = _condominium_id 
      AND status IN ('pendente', 'em_aprovacao')
      AND EXTRACT(YEAR FROM expense_date) = current_year;
    
    -- 4. Calculate total remaining from previous years
    SELECT COALESCE(SUM(saldo_atual), 0) INTO remanescente_result
    FROM remanescente_anual 
    WHERE condominium_id = _condominium_id 
      AND ano_referencia < current_year;
    
    -- 5. Calculate available balance
    saldo_result := receita_result - despesas_aprovadas_result + remanescente_result;
    
    -- Return structured JSON
    RETURN json_build_object(
        'ano_atual', current_year,
        'receita_atual', receita_result,
        'despesas_aprovadas', despesas_aprovadas_result,
        'despesas_pendentes', despesas_pendentes_result,
        'remanescente_total', remanescente_result,
        'saldo_disponivel', saldo_result,
        'saldo_receita_atual', receita_result - despesas_aprovadas_result,
        'pode_gastar_receita', GREATEST(0, receita_result - despesas_aprovadas_result),
        'pode_gastar_remanescente', GREATEST(0, remanescente_result)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;