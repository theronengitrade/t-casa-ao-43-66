-- =====================================================
-- FINALIZAR CORREÇÕES DE SEGURANÇA - FUNÇÕES RESTANTES
-- =====================================================

-- Corrigir as funções restantes que ainda têm problemas de search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = _user_id AND role = _role
    )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_condominium(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT condominium_id 
    FROM public.profiles 
    WHERE user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.check_license_active(_condominium_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 
        FROM public.licenses 
        WHERE condominium_id = _condominium_id 
        AND status = 'active' 
        AND end_date >= CURRENT_DATE
    )
$function$;

-- Função adicional de segurança para validação de emails únicos
CREATE OR REPLACE FUNCTION public.is_email_available(_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE email = _email
    )
$function$;

-- Função para criar índices únicos compostos para apartamentos por condomínio
-- (Esta será chamada automaticamente pela migração)
DO $$ 
BEGIN
    -- Criar índice único para apartamentos por condomínio se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_residents_unique_apartment_per_condominium'
    ) THEN
        CREATE UNIQUE INDEX idx_residents_unique_apartment_per_condominium 
        ON public.residents (condominium_id, UPPER(TRIM(apartment_number)));
        
        RAISE NOTICE 'Criado índice único para apartamentos por condomínio';
    END IF;
    
    -- Criar índice para melhorar performance das consultas de linking code
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_condominiums_linking_code_lower'
    ) THEN
        CREATE INDEX idx_condominiums_linking_code_lower 
        ON public.condominiums (LOWER(resident_linking_code));
        
        RAISE NOTICE 'Criado índice para linking codes';
    END IF;
    
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Índices já existem, pulando criação';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar índices: %', SQLERRM;
END $$;

-- Função de auditoria melhorada com logs mais detalhados
CREATE OR REPLACE FUNCTION public.log_audit_trail()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Log detalhado da operação
  RAISE LOG 'AUDIT: % operation on table % by user % for record %', 
    TG_OP, TG_TABLE_NAME, auth.uid(), COALESCE(NEW.id, OLD.id);
    
  INSERT INTO public.audit_logs (
    user_id,
    condominium_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.condominium_id, OLD.condominium_id, get_user_condominium(auth.uid())),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro mas não falha a operação principal
    RAISE LOG 'AUDIT ERROR: Failed to log operation % on table %: %', 
      TG_OP, TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$function$;