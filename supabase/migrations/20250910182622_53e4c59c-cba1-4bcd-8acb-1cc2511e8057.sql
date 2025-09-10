-- Criar estrutura separada para controle financeiro do negócio de venda do sistema
-- Esta é uma estrutura completamente separada dos dados operacionais dos condomínios

-- Tabela para clientes (condomínios que compram o sistema)
CREATE TABLE public.business_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID REFERENCES public.cities(id),
  apartment_count INTEGER NOT NULL DEFAULT 0,
  monthly_fee_per_apartment NUMERIC NOT NULL DEFAULT 0,
  payment_plan TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_plan IN ('monthly', 'biannual', 'annual')),
  total_monthly_value NUMERIC GENERATED ALWAYS AS (apartment_count * monthly_fee_per_apartment) STORED,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para controle de pagamentos do negócio
CREATE TABLE public.business_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.business_clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, year, month)
);

-- RLS para business_clients
ALTER TABLE public.business_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage business clients" 
ON public.business_clients 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- RLS para business_payments  
ALTER TABLE public.business_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage business payments" 
ON public.business_payments 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_business_clients_updated_at
    BEFORE UPDATE ON public.business_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_business_updated_at();

CREATE TRIGGER update_business_payments_updated_at
    BEFORE UPDATE ON public.business_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_business_updated_at();