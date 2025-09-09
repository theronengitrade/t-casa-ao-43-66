-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  document_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payroll entries table
CREATE TABLE public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  condominium_id UUID NOT NULL,
  reference_month DATE NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC NOT NULL DEFAULT 0,
  overtime_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_amount NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  social_security_deduction NUMERIC NOT NULL DEFAULT 0,
  income_tax_deduction NUMERIC NOT NULL DEFAULT 0,
  other_deductions NUMERIC NOT NULL DEFAULT 0,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  expense_id UUID, -- Link to expenses table
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
CREATE POLICY "Multi-tenant access for employees"
  ON public.employees
  FOR ALL
  USING (condominium_id = get_user_condominium(auth.uid()));

-- Create RLS policies for payroll_entries  
CREATE POLICY "Multi-tenant access for payroll_entries"
  ON public.payroll_entries
  FOR ALL
  USING (condominium_id = get_user_condominium(auth.uid()));

-- Create function to generate monthly payroll
CREATE OR REPLACE FUNCTION public.generate_monthly_payroll(_condominium_id uuid, _reference_month date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employee RECORD;
  _payroll_count INTEGER := 0;
  _total_amount NUMERIC := 0;
  _currency currency_type;
  _gross_salary NUMERIC;
  _net_salary NUMERIC;
  _overtime_amount NUMERIC;
  _social_security NUMERIC;
  _income_tax NUMERIC;
BEGIN
  -- Get condominium currency
  SELECT currency INTO _currency FROM condominiums WHERE id = _condominium_id;
  
  -- Generate payroll for all active employees
  FOR _employee IN 
    SELECT e.* FROM employees e 
    WHERE e.condominium_id = _condominium_id 
    AND e.is_active = true
  LOOP
    -- Check if payroll already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM payroll_entries 
      WHERE employee_id = _employee.id 
      AND reference_month = _reference_month
    ) THEN
      -- Calculate overtime (if any)
      _overtime_amount := _employee.base_salary * 0.0; -- Default to 0, can be updated later
      
      -- Calculate gross salary
      _gross_salary := _employee.base_salary + _overtime_amount;
      
      -- Calculate deductions (example rates - adjust as needed)
      _social_security := _gross_salary * 0.08; -- 8% social security
      _income_tax := CASE 
        WHEN _gross_salary > 70000 THEN _gross_salary * 0.17 -- 17% for higher salaries
        WHEN _gross_salary > 50000 THEN _gross_salary * 0.15 -- 15% for mid salaries
        ELSE _gross_salary * 0.10 -- 10% for lower salaries
      END;
      
      -- Calculate net salary
      _net_salary := _gross_salary - _social_security - _income_tax;
      
      INSERT INTO payroll_entries (
        employee_id,
        condominium_id,
        reference_month,
        base_salary,
        overtime_amount,
        gross_salary,
        social_security_deduction,
        income_tax_deduction,
        net_salary,
        payment_status
      ) VALUES (
        _employee.id,
        _condominium_id,
        _reference_month,
        _employee.base_salary,
        _overtime_amount,
        _gross_salary,
        _social_security,
        _income_tax,
        _net_salary,
        'pending'
      );
      
      _payroll_count := _payroll_count + 1;
      _total_amount := _total_amount + _net_salary;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'entries_created', _payroll_count,
    'total_amount', _total_amount,
    'currency', _currency,
    'reference_month', _reference_month
  );
END;
$$;

-- Create function to process payroll payment (creates expense entry)
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
  
  -- Create expense entry
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
    'Recursos Humanos',
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

-- Add update timestamp triggers
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at
  BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();