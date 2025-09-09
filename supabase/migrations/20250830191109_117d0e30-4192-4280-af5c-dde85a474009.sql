-- Criar condomínio de demonstração com código específico para testes
INSERT INTO public.condominiums (
  name,
  address,
  resident_linking_code,
  currency,
  current_monthly_fee,
  email,
  phone
) VALUES (
  'Condomínio Demo T-Casa',
  'Rua da Demonstração, Luanda',
  'fecf7bee03b5f41c',
  'AOA',
  75000,
  'demo@tcasa.ao',
  '+244 900 000 000'
) ON CONFLICT (resident_linking_code) DO NOTHING;