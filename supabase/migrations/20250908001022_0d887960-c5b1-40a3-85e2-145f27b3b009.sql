-- Parte 2: Atualizar perfis com coordination_staff_id e melhorar função de permissões

-- Atualizar os perfis dos coordenadores com os IDs criados
UPDATE public.profiles 
SET coordination_staff_id = cs.id,
    updated_at = now()
FROM public.coordination_staff cs
WHERE profiles.user_id = cs.user_id 
  AND profiles.role = 'coordinator'
  AND profiles.coordination_staff_id IS NULL;