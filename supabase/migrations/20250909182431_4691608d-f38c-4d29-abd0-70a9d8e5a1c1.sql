-- Adicionar campos necessários para gestão financeira dos condomínios
ALTER TABLE condominiums 
ADD COLUMN IF NOT EXISTS apartment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee_per_apartment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_plan TEXT DEFAULT 'monthly' CHECK (payment_plan IN ('monthly', 'biannual', 'annual'));

-- Criar tabela para controle de pagamentos mensais dos condomínios
CREATE TABLE IF NOT EXISTS condominium_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(condominium_id, year, month)
);

-- Habilitar RLS na nova tabela
ALTER TABLE condominium_payments ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para super admins
CREATE POLICY "Super admins can manage condominium payments" 
ON condominium_payments 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_condominium_payments_condominium_id ON condominium_payments(condominium_id);
CREATE INDEX IF NOT EXISTS idx_condominium_payments_year_month ON condominium_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_condominium_payments_status ON condominium_payments(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_condominium_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_condominium_payments_updated_at_trigger
    BEFORE UPDATE ON condominium_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_condominium_payments_updated_at();

-- Função para calcular receitas automaticamente
CREATE OR REPLACE FUNCTION calculate_revenue_stats(
    _city_id UUID DEFAULT NULL,
    _condominium_id UUID DEFAULT NULL,
    _payment_plan TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
    total_revenue NUMERIC := 0;
    monthly_revenue NUMERIC := 0;
    biannual_revenue NUMERIC := 0;
    annual_revenue NUMERIC := 0;
BEGIN
    -- Query base para buscar dados
    WITH payment_data AS (
        SELECT 
            c.id,
            c.name,
            c.payment_plan,
            c.apartment_count,
            c.monthly_fee_per_apartment,
            cp.status,
            cp.amount,
            cc.city_id
        FROM condominiums c
        LEFT JOIN condominium_payments cp ON c.id = cp.condominium_id
        LEFT JOIN condominium_cities cc ON c.id = cc.condominium_id
        WHERE 
            (_city_id IS NULL OR cc.city_id = _city_id)
            AND (_condominium_id IS NULL OR c.id = _condominium_id)
            AND (_payment_plan IS NULL OR c.payment_plan = _payment_plan)
    )
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'monthly' AND status = 'paid' THEN amount ELSE 0 END), 0) as monthly_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'biannual' AND status = 'paid' THEN amount ELSE 0 END), 0) as biannual_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'annual' AND status = 'paid' THEN amount ELSE 0 END), 0) as annual_paid
    INTO total_revenue, monthly_revenue, biannual_revenue, annual_revenue
    FROM payment_data;

    result := json_build_object(
        'total_revenue', total_revenue,
        'monthly_revenue', monthly_revenue,
        'biannual_revenue', biannual_revenue,
        'annual_revenue', annual_revenue
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;