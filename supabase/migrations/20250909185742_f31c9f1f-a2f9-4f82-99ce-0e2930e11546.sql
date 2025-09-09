-- Inserir dados de teste para demonstrar funcionalidades
-- Primeiro, vamos inserir alguns condomínios de teste

-- Condomínio para Luanda
INSERT INTO public.condominiums (name, address, apartment_count, monthly_fee_per_apartment, payment_plan) 
VALUES ('Residencial Talatona', 'Rua Principal, Talatona, Luanda', 50, 75000, 'monthly')
ON CONFLICT DO NOTHING;

-- Condomínio para Benguela  
INSERT INTO public.condominiums (name, address, apartment_count, monthly_fee_per_apartment, payment_plan) 
VALUES ('Condomínio Atlântico', 'Av. Marginal, Benguela', 30, 60000, 'biannual')
ON CONFLICT DO NOTHING;

-- Condomínio para Huambo
INSERT INTO public.condominiums (name, address, apartment_count, monthly_fee_per_apartment, payment_plan) 
VALUES ('Torres do Planalto', 'Centro da Cidade, Huambo', 40, 50000, 'annual')
ON CONFLICT DO NOTHING;

-- Associar condomínios às cidades (assumindo que as cidades já existem)
DO $$ 
DECLARE
    luanda_id uuid;
    benguela_id uuid;
    huambo_id uuid;
    condo_talatona_id uuid;
    condo_atlantico_id uuid;
    condo_planalto_id uuid;
BEGIN
    -- Buscar IDs das cidades
    SELECT id INTO luanda_id FROM public.cities WHERE name = 'Luanda';
    SELECT id INTO benguela_id FROM public.cities WHERE name = 'Benguela';  
    SELECT id INTO huambo_id FROM public.cities WHERE name = 'Huambo';
    
    -- Buscar IDs dos condomínios
    SELECT id INTO condo_talatona_id FROM public.condominiums WHERE name = 'Residencial Talatona';
    SELECT id INTO condo_atlantico_id FROM public.condominiums WHERE name = 'Condomínio Atlântico';
    SELECT id INTO condo_planalto_id FROM public.condominiums WHERE name = 'Torres do Planalto';
    
    -- Associar condomínios às cidades
    IF luanda_id IS NOT NULL AND condo_talatona_id IS NOT NULL THEN
        INSERT INTO public.condominium_cities (condominium_id, city_id) 
        VALUES (condo_talatona_id, luanda_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF benguela_id IS NOT NULL AND condo_atlantico_id IS NOT NULL THEN
        INSERT INTO public.condominium_cities (condominium_id, city_id) 
        VALUES (condo_atlantico_id, benguela_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF huambo_id IS NOT NULL AND condo_planalto_id IS NOT NULL THEN
        INSERT INTO public.condominium_cities (condominium_id, city_id) 
        VALUES (condo_planalto_id, huambo_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Criar pagamentos de teste para 2025
DO $$
DECLARE
    condo_record RECORD;
    month_num integer;
    amount_calc numeric;
    status_array text[] := ARRAY['paid', 'pending', 'overdue'];
    random_status text;
BEGIN
    FOR condo_record IN SELECT id, apartment_count, monthly_fee_per_apartment, payment_plan FROM public.condominiums LOOP
        FOR month_num IN 1..12 LOOP
            -- Calcular valor baseado no plano
            amount_calc := condo_record.apartment_count * condo_record.monthly_fee_per_apartment;
            IF condo_record.payment_plan = 'annual' THEN
                amount_calc := amount_calc * 12;
            ELSIF condo_record.payment_plan = 'biannual' THEN
                amount_calc := amount_calc * 6;
            END IF;
            
            -- Status aleatório para demonstração
            random_status := status_array[1 + (random() * 2)::int];
            
            INSERT INTO public.condominium_payments (
                condominium_id, 
                year, 
                month, 
                amount, 
                status,
                payment_date
            ) VALUES (
                condo_record.id,
                2025,
                month_num,
                amount_calc,
                random_status,
                CASE WHEN random_status = 'paid' THEN CURRENT_DATE - (random() * 30)::int ELSE NULL END
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;