-- T-Casa Condominium Management System - Multi-tenant SaaS Database Schema

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('super_admin', 'coordinator', 'resident');
CREATE TYPE public.license_status AS ENUM ('active', 'paused', 'expired');
CREATE TYPE public.currency_type AS ENUM ('AOA', 'EUR', 'BRL', 'MZN');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Condominiums table (multi-tenant core)
CREATE TABLE public.condominiums (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    currency currency_type NOT NULL DEFAULT 'AOA',
    resident_linking_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Licenses table (annual licenses per condominium)
CREATE TABLE public.licenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    status license_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    condominium_id UUID REFERENCES public.condominiums(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    apartment_number TEXT,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Residents table (additional resident-specific data)
CREATE TABLE public.residents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    apartment_number TEXT NOT NULL,
    document_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    move_in_date DATE,
    is_owner BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Visitors table
CREATE TABLE public.visitors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_number TEXT,
    phone TEXT,
    visit_date DATE NOT NULL,
    visit_time TIME,
    purpose TEXT,
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service providers table
CREATE TABLE public.service_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    document_number TEXT,
    is_authorized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    is_urgent BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments table (monthly quotas and other payments)
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency currency_type NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status payment_status NOT NULL DEFAULT 'pending',
    reference_month DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    condominium_id UUID REFERENCES public.condominiums(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Helper function to get user's condominium
CREATE OR REPLACE FUNCTION public.get_user_condominium(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT condominium_id 
    FROM public.profiles 
    WHERE user_id = _user_id
$$;

-- Helper function to check license status
CREATE OR REPLACE FUNCTION public.check_license_active(_condominium_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.licenses 
        WHERE condominium_id = _condominium_id 
        AND status = 'active' 
        AND end_date >= CURRENT_DATE
    )
$$;

-- RLS Policies

-- Condominiums: Super admins see all, others see only their own
CREATE POLICY "Super admins can see all condominiums"
ON public.condominiums FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can see their own condominium"
ON public.condominiums FOR SELECT
TO authenticated
USING (id = public.get_user_condominium(auth.uid()));

-- Licenses: Super admins see all, others see only their condominium's
CREATE POLICY "Super admins can manage all licenses"
ON public.licenses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can see their condominium's license"
ON public.licenses FOR SELECT
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

-- Profiles: Users can see profiles in their condominium
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can see profiles in their condominium"
ON public.profiles FOR SELECT
TO authenticated
USING (
    condominium_id = public.get_user_condominium(auth.uid()) OR
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Residents: Coordinators and residents in same condominium
CREATE POLICY "Coordinators can manage residents in their condominium"
ON public.residents FOR ALL
TO authenticated
USING (
    (public.has_role(auth.uid(), 'coordinator') AND 
     condominium_id = public.get_user_condominium(auth.uid())) OR
    public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Residents can see residents in their condominium"
ON public.residents FOR SELECT
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

-- Multi-tenant policies for other tables follow same pattern
CREATE POLICY "Multi-tenant access for visitors"
ON public.visitors FOR ALL
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

CREATE POLICY "Multi-tenant access for service_providers"
ON public.service_providers FOR ALL
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

CREATE POLICY "Multi-tenant access for documents"
ON public.documents FOR ALL
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

CREATE POLICY "Multi-tenant access for announcements"
ON public.announcements FOR ALL
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

CREATE POLICY "Multi-tenant access for payments"
ON public.payments FOR ALL
TO authenticated
USING (condominium_id = public.get_user_condominium(auth.uid()));

CREATE POLICY "Multi-tenant access for audit_logs"
ON public.audit_logs FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    condominium_id = public.get_user_condominium(auth.uid())
);

-- Trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    linking_code TEXT;
    condo_id UUID;
BEGIN
    -- Extract linking code from metadata if present (for residents)
    linking_code := NEW.raw_user_meta_data ->> 'linking_code';
    
    IF linking_code IS NOT NULL THEN
        -- Find condominium by linking code
        SELECT id INTO condo_id 
        FROM public.condominiums 
        WHERE resident_linking_code = linking_code;
        
        IF condo_id IS NOT NULL THEN
            -- Create resident profile
            INSERT INTO public.profiles (user_id, condominium_id, role, first_name, last_name, phone)
            VALUES (
                NEW.id,
                condo_id,
                'resident',
                COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
                COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
                NEW.phone
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_condominiums_updated_at
    BEFORE UPDATE ON public.condominiums
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_residents_updated_at
    BEFORE UPDATE ON public.residents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at
    BEFORE UPDATE ON public.visitors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_condominium_id ON public.profiles(condominium_id);
CREATE INDEX idx_licenses_condominium_id ON public.licenses(condominium_id);
CREATE INDEX idx_residents_condominium_id ON public.residents(condominium_id);
CREATE INDEX idx_visitors_condominium_id ON public.visitors(condominium_id);
CREATE INDEX idx_payments_condominium_id ON public.payments(condominium_id);
CREATE INDEX idx_payments_resident_id ON public.payments(resident_id);
CREATE INDEX idx_audit_logs_condominium_id ON public.audit_logs(condominium_id);
CREATE INDEX idx_condominiums_linking_code ON public.condominiums(resident_linking_code);