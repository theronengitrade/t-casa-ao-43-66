-- Create storage buckets for the system
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'text/plain']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('announcements', 'announcements', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']);

-- Create RLS policies for documents bucket
CREATE POLICY "Users can view documents in their condominium"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

CREATE POLICY "Coordinators can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'coordinator'::user_role) AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

CREATE POLICY "Coordinators can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'coordinator'::user_role) AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

CREATE POLICY "Coordinators can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'coordinator'::user_role) AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

-- Create RLS policies for avatars bucket
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for announcements bucket
CREATE POLICY "Users can view announcement attachments in their condominium"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'announcements' AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

CREATE POLICY "Coordinators can manage announcement attachments"
ON storage.objects FOR ALL
USING (
  bucket_id = 'announcements' AND
  has_role(auth.uid(), 'coordinator'::user_role) AND
  (storage.foldername(name))[1] = get_user_condominium(auth.uid())::text
);

-- Add realtime support for key tables
ALTER TABLE public.residents REPLICA IDENTITY FULL;
ALTER TABLE public.visitors REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE residents;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- Create function for automatic audit logging
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- Create audit triggers for main tables
CREATE TRIGGER audit_residents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON residents
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_visitors_trigger
  AFTER INSERT OR UPDATE OR DELETE ON visitors
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_announcements_trigger
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Create function to generate monthly payments automatically
CREATE OR REPLACE FUNCTION public.generate_monthly_payments(
  _condominium_id UUID,
  _reference_month DATE,
  _amount NUMERIC,
  _description TEXT DEFAULT 'Quota mensal',
  _due_days INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _resident RECORD;
  _due_date DATE;
  _currency currency_type;
  _count INTEGER := 0;
BEGIN
  -- Get condominium currency
  SELECT currency INTO _currency FROM condominiums WHERE id = _condominium_id;
  
  -- Calculate due date (10th of the month after reference month)
  _due_date := (DATE_TRUNC('month', _reference_month) + INTERVAL '1 month' + INTERVAL '10 days')::DATE;
  
  -- Generate payments for all residents in condominium
  FOR _resident IN 
    SELECT r.id, r.profile_id 
    FROM residents r 
    WHERE r.condominium_id = _condominium_id
  LOOP
    -- Check if payment already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM payments 
      WHERE resident_id = _resident.id 
      AND reference_month = _reference_month
    ) THEN
      INSERT INTO payments (
        condominium_id,
        resident_id,
        description,
        amount,
        currency,
        due_date,
        status,
        reference_month
      ) VALUES (
        _condominium_id,
        _resident.id,
        _description,
        _amount,
        _currency,
        _due_date,
        'pending',
        _reference_month
      );
      
      _count := _count + 1;
    END IF;
  END LOOP;
  
  RETURN _count;
END;
$$;