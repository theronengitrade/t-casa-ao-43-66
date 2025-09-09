-- Criar enum para tipos de membro da coordenação
CREATE TYPE coordination_member_role AS ENUM (
  'coordinator',
  'financial',
  'security', 
  'maintenance',
  'administration',
  'secretary'
);

-- Atualizar tabela coordination_staff para incluir permissões de sistema
ALTER TABLE coordination_staff 
ADD COLUMN role coordination_member_role NOT NULL DEFAULT 'administration',
ADD COLUMN has_system_access BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN permissions JSONB DEFAULT '{}',
ADD COLUMN assigned_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Criar índice para performance
CREATE INDEX idx_coordination_staff_role ON coordination_staff(role);
CREATE INDEX idx_coordination_staff_condominium_access ON coordination_staff(condominium_id, has_system_access);

-- Atualizar RLS para permitir que residentes vejam membros da coordenação
DROP POLICY IF EXISTS "Multi-tenant access for coordination_staff" ON coordination_staff;

CREATE POLICY "Residents can view coordination staff" 
ON coordination_staff 
FOR SELECT 
USING (condominium_id = get_user_condominium(auth.uid()));

CREATE POLICY "Coordinators can manage coordination staff" 
ON coordination_staff 
FOR ALL 
USING (
  condominium_id = get_user_condominium(auth.uid()) 
  AND has_role(auth.uid(), 'coordinator')
);

-- Atualizar tabela profiles para suportar coordination_staff
ALTER TABLE profiles 
ADD COLUMN coordination_staff_id UUID REFERENCES coordination_staff(id) ON DELETE SET NULL;

-- Criar função para obter permissões de membro da coordenação
CREATE OR REPLACE FUNCTION get_coordination_member_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _permissions jsonb := '{}';
  _member_role coordination_member_role;
BEGIN
  -- Buscar role do membro da coordenação
  SELECT cs.role, cs.permissions
  INTO _member_role, _permissions
  FROM coordination_staff cs
  JOIN profiles p ON p.coordination_staff_id = cs.id
  WHERE p.user_id = _user_id AND cs.has_system_access = true;
  
  -- Se não encontrou, retornar permissões vazias
  IF _member_role IS NULL THEN
    RETURN '{}';
  END IF;
  
  -- Definir permissões base por role
  CASE _member_role
    WHEN 'coordinator' THEN
      _permissions := _permissions || '{"all": true}'::jsonb;
    WHEN 'financial' THEN
      _permissions := _permissions || '{"payments": true, "expenses": true, "payroll": true, "financial_reports": true}'::jsonb;
    WHEN 'security' THEN
      _permissions := _permissions || '{"visitors": true, "qr_codes": true, "occurrences": true, "announcements": true}'::jsonb;
    WHEN 'maintenance' THEN
      _permissions := _permissions || '{"action_plans": true, "service_providers": true, "occurrences": true}'::jsonb;
    WHEN 'administration' THEN
      _permissions := _permissions || '{"residents": true, "documents": true, "space_reservations": true}'::jsonb;
    WHEN 'secretary' THEN
      _permissions := _permissions || '{"announcements": true, "documents": true, "residents": true}'::jsonb;
  END CASE;
  
  RETURN _permissions;
END;
$$;

-- Função para verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION has_coordination_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _permissions jsonb;
BEGIN
  _permissions := get_coordination_member_permissions(_user_id);
  
  -- Se tem permissão "all", pode tudo
  IF (_permissions->>'all')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão específica
  RETURN (_permissions->>_permission)::boolean = true;
END;
$$;