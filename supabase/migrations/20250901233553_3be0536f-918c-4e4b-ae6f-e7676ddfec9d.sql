-- Create specific campaigns table for fundraising campaigns
CREATE TABLE public.specific_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominium_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specific contributions table for individual resident contributions
CREATE TABLE public.specific_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.specific_campaigns(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL,
  condominium_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specific_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specific_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Multi-tenant access for specific_campaigns" 
ON public.specific_campaigns 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- RLS Policies for contributions
CREATE POLICY "Multi-tenant access for specific_contributions" 
ON public.specific_contributions 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_specific_campaigns_condominium ON public.specific_campaigns(condominium_id);
CREATE INDEX idx_specific_campaigns_status ON public.specific_campaigns(status);
CREATE INDEX idx_specific_contributions_campaign ON public.specific_contributions(campaign_id);
CREATE INDEX idx_specific_contributions_resident ON public.specific_contributions(resident_id);
CREATE INDEX idx_specific_contributions_status ON public.specific_contributions(status);

-- Create trigger for updated_at
CREATE TRIGGER update_specific_campaigns_updated_at
  BEFORE UPDATE ON public.specific_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specific_contributions_updated_at
  BEFORE UPDATE ON public.specific_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create comprehensive view for campaign analytics
CREATE OR REPLACE VIEW public.campaign_analytics AS
SELECT 
  sc.id as campaign_id,
  sc.condominium_id,
  sc.title,
  sc.description,
  sc.target_amount,
  sc.start_date,
  sc.end_date,
  sc.status as campaign_status,
  sc.created_at,
  
  -- Financial KPIs
  COALESCE(SUM(CASE WHEN sco.status = 'paid' THEN sco.amount ELSE 0 END), 0) as total_raised,
  COALESCE(SUM(CASE WHEN sco.status = 'pending' THEN sco.amount ELSE 0 END), 0) as total_pending,
  sc.target_amount - COALESCE(SUM(CASE WHEN sco.status = 'paid' THEN sco.amount ELSE 0 END), 0) as remaining_amount,
  
  -- Progress percentage
  CASE 
    WHEN sc.target_amount > 0 THEN 
      ROUND((COALESCE(SUM(CASE WHEN sco.status = 'paid' THEN sco.amount ELSE 0 END), 0) / sc.target_amount * 100), 2)
    ELSE 0 
  END as progress_percentage,
  
  -- Contributor statistics
  COUNT(DISTINCT CASE WHEN sco.status IN ('paid', 'pending') THEN sco.resident_id END) as total_contributors,
  COUNT(DISTINCT CASE WHEN sco.status = 'paid' THEN sco.resident_id END) as paid_contributors,
  COUNT(DISTINCT CASE WHEN sco.status = 'pending' THEN sco.resident_id END) as pending_contributors,
  
  -- Contribution counts
  COUNT(CASE WHEN sco.status = 'paid' THEN 1 END) as paid_contributions_count,
  COUNT(CASE WHEN sco.status = 'pending' THEN 1 END) as pending_contributions_count,
  
  -- Average contribution
  CASE 
    WHEN COUNT(CASE WHEN sco.status = 'paid' THEN 1 END) > 0 THEN
      ROUND(COALESCE(SUM(CASE WHEN sco.status = 'paid' THEN sco.amount ELSE 0 END), 0) / 
            COUNT(CASE WHEN sco.status = 'paid' THEN 1 END), 2)
    ELSE 0 
  END as average_contribution

FROM public.specific_campaigns sc
LEFT JOIN public.specific_contributions sco ON sc.id = sco.campaign_id
GROUP BY sc.id, sc.condominium_id, sc.title, sc.description, sc.target_amount, 
         sc.start_date, sc.end_date, sc.status, sc.created_at;

-- Create RPC function for detailed campaign report
CREATE OR REPLACE FUNCTION public.get_campaign_report(_campaign_id uuid, _condominium_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _result json;
BEGIN
  SELECT json_build_object(
    'campaign', row_to_json(ca.*),
    'contributions', COALESCE(contributions_array, '[]'::json)
  ) INTO _result
  FROM public.campaign_analytics ca
  LEFT JOIN (
    SELECT 
      sc.campaign_id,
      json_agg(
        json_build_object(
          'id', sc.id,
          'resident_id', sc.resident_id,
          'resident_name', CONCAT(p.first_name, ' ', p.last_name),
          'apartment_number', r.apartment_number,
          'amount', sc.amount,
          'status', sc.status,
          'payment_date', sc.payment_date,
          'notes', sc.notes,
          'created_at', sc.created_at
        ) ORDER BY sc.created_at DESC
      ) as contributions_array
    FROM public.specific_contributions sc
    INNER JOIN public.residents r ON sc.resident_id = r.id
    INNER JOIN public.profiles p ON r.profile_id = p.id
    WHERE sc.campaign_id = _campaign_id
    GROUP BY sc.campaign_id
  ) contrib_data ON ca.campaign_id = contrib_data.campaign_id
  WHERE ca.campaign_id = _campaign_id 
    AND ca.condominium_id = _condominium_id;
    
  RETURN COALESCE(_result, json_build_object('error', 'Campaign not found'));
END;
$$;