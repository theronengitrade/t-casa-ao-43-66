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

-- Função para gerar pagamentos anuais para um cliente
CREATE OR REPLACE FUNCTION public.generate_business_payments_for_client(
  _client_id UUID,
  _year INTEGER
) RETURNS INTEGER AS $$
DECLARE
  _client RECORD;
  _month INTEGER;
  _amount NUMERIC;
  _count INTEGER := 0;
BEGIN
  -- Buscar dados do cliente
  SELECT * INTO _client FROM public.business_clients WHERE id = _client_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calcular valor baseado no plano
  _amount := _client.total_monthly_value;
  IF _client.payment_plan = 'annual' THEN
    _amount := _amount * 12;
  ELSIF _client.payment_plan = 'biannual' THEN
    _amount := _amount * 6;
  END IF;
  
  -- Gerar pagamentos conforme o plano
  IF _client.payment_plan = 'monthly' THEN
    FOR _month IN 1..12 LOOP
      INSERT INTO public.business_payments (client_id, year, month, amount, status)
      VALUES (_client_id, _year, _month, _amount, 'pending')
      ON CONFLICT (client_id, year, month) DO NOTHING;
      
      IF FOUND THEN
        _count := _count + 1;
      END IF;
    END LOOP;
  ELSIF _client.payment_plan = 'biannual' THEN
    -- Semestral: Janeiro e Julho
    FOR _month IN ARRAY[1, 7] LOOP
      INSERT INTO public.business_payments (client_id, year, month, amount, status)
      VALUES (_client_id, _year, _month, _amount, 'pending')
      ON CONFLICT (client_id, year, month) DO NOTHING;
      
      IF FOUND THEN
        _count := _count + 1;
      END IF;
    END LOOP;
  ELSIF _client.payment_plan = 'annual' THEN
    -- Anual: Janeiro
    INSERT INTO public.business_payments (client_id, year, month, amount, status)
    VALUES (_client_id, _year, 1, _amount, 'pending')
    ON CONFLICT (client_id, year, month) DO NOTHING;
    
    IF FOUND THEN
      _count := _count + 1;
    END IF;
  END IF;
  
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;