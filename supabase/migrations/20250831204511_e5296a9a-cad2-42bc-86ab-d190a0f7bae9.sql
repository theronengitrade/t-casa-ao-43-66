-- Create expenses table
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominium_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('Salários', 'Coordenação', 'Prestadores de Serviços', 'Outros')),
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL,
  service_provider_id uuid NULL, -- Referência ao prestador se categoria for "Prestadores de Serviços"
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT expenses_condominium_fkey FOREIGN KEY (condominium_id) REFERENCES public.condominiums(id) ON DELETE CASCADE,
  CONSTRAINT expenses_service_provider_fkey FOREIGN KEY (service_provider_id) REFERENCES public.service_providers(id) ON DELETE SET NULL,
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Multi-tenant access for expenses"
ON public.expenses
FOR ALL
USING (condominium_id = get_user_condominium(auth.uid()));

-- Coordinators can manage expenses in their condominium
CREATE POLICY "Coordinators can manage expenses"
ON public.expenses
FOR ALL
USING (
  has_role(auth.uid(), 'coordinator'::user_role) AND 
  condominium_id = get_user_condominium(auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_expenses_condominium_id ON public.expenses(condominium_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_service_provider_id ON public.expenses(service_provider_id);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();