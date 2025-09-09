-- 1. CORRIGIR A FUNÇÃO: Trocar 'Recursos Humanos' por 'Salários'
CREATE OR REPLACE FUNCTION public.process_payroll_payment(_payroll_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payroll RECORD;
  _employee RECORD;
  _expense_id UUID;
BEGIN
  -- Get payroll entry
  SELECT pe.*, e.name as employee_name, e.position
  INTO _payroll
  FROM payroll_entries pe
  JOIN employees e ON pe.employee_id = e.id
  WHERE pe.id = _payroll_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payroll entry not found');
  END IF;
  
  -- Create expense entry com categoria corrigida
  INSERT INTO expenses (
    condominium_id,
    description,
    category,
    amount,
    expense_date,
    created_by
  ) VALUES (
    _payroll.condominium_id,
    'Salário - ' || _payroll.employee_name || ' (' || _payroll.position || ')',
    'Salários', -- CORRIGIDO: era 'Recursos Humanos'
    _payroll.net_salary,
    CURRENT_DATE,
    auth.uid()
  ) RETURNING id INTO _expense_id;
  
  -- Update payroll entry
  UPDATE payroll_entries 
  SET 
    payment_status = 'paid',
    payment_date = CURRENT_DATE,
    expense_id = _expense_id,
    updated_at = now()
  WHERE id = _payroll_id;
  
  RETURN json_build_object(
    'success', true,
    'expense_id', _expense_id,
    'amount', _payroll.net_salary
  );
END;
$$;