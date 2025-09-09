-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.campaign_analytics;

CREATE VIEW public.campaign_analytics AS
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
WHERE sc.condominium_id = get_user_condominium(auth.uid())
GROUP BY sc.id, sc.condominium_id, sc.title, sc.description, sc.target_amount, 
         sc.start_date, sc.end_date, sc.status, sc.created_at;