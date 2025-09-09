-- Adicionar foreign key constraint entre payroll_entries e employees
ALTER TABLE public.payroll_entries 
ADD CONSTRAINT fk_payroll_entries_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) 
ON DELETE CASCADE;