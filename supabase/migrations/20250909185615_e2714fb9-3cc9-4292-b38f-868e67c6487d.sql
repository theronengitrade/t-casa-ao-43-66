-- Corrigir função de cálculo de receitas que está faltando
CREATE OR REPLACE FUNCTION public.calculate_revenue_stats(
    _city_id uuid DEFAULT NULL,
    _condominium_id uuid DEFAULT NULL,
    _payment_plan text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_revenue NUMERIC := 0;
    monthly_revenue NUMERIC := 0;
    biannual_revenue NUMERIC := 0;
    annual_revenue NUMERIC := 0;
BEGIN
    -- Query base para buscar dados de pagamentos
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
            AND cp.status = 'paid'
    )
    SELECT 
        COALESCE(SUM(amount), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'monthly' THEN amount ELSE 0 END), 0) as monthly_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'biannual' THEN amount ELSE 0 END), 0) as biannual_paid,
        COALESCE(SUM(CASE WHEN payment_plan = 'annual' THEN amount ELSE 0 END), 0) as annual_paid
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
$$;