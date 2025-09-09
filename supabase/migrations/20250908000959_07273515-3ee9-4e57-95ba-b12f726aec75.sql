-- Parte 1: Corrigir coordenadores existentes sem registro na coordination_staff

-- Criar registros na coordination_staff para coordenadores existentes
INSERT INTO public.coordination_staff (
  condominium_id,
  name,
  position,
  phone,
  role,
  has_system_access,
  user_id,
  created_by,
  assigned_date
)
SELECT 
  p.condominium_id,
  p.first_name || ' ' || p.last_name as name,
  'Coordenador Principal' as position,
  p.phone,
  'coordinator'::coordination_member_role as role,
  true as has_system_access,
  p.user_id,
  p.user_id as created_by,
  CURRENT_DATE as assigned_date
FROM public.profiles p
WHERE p.role = 'coordinator' 
  AND p.condominium_id IS NOT NULL
  AND p.coordination_staff_id IS NULL;