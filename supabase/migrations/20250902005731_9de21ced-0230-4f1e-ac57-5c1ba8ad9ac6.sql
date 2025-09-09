-- Fix get_campaign_report to remove GROUP BY error by using ORDER BY inside json_agg
CREATE OR REPLACE FUNCTION public.get_campaign_report(_campaign_id uuid, _condominium_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  campaign_data JSON;
  contributions_data JSON;
  result JSON;
BEGIN
  -- Get campaign data with analytics
  SELECT json_build_object(
    'campaign_id', c.id,
    'condominium_id', c.condominium_id,
    'title', c.title,
    'description', c.description,
    'target_amount', c.target_amount,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'campaign_status', c.status,
    'created_at', c.created_at,
    'total_raised', COALESCE(paid_sum.total, 0),
    'total_pending', COALESCE(pending_sum.total, 0),
    'remaining_amount', c.target_amount - COALESCE(paid_sum.total, 0),
    'progress_percentage', CASE 
      WHEN c.target_amount > 0 THEN ROUND((COALESCE(paid_sum.total, 0) / c.target_amount * 100))
      ELSE 0 
    END,
    'total_contributors', COALESCE(total_contributors.count, 0),
    'paid_contributors', COALESCE(paid_contributors.count, 0),
    'pending_contributors', COALESCE(pending_contributors.count, 0),
    'paid_contributions_count', COALESCE(paid_contributions.count, 0),
    'pending_contributions_count', COALESCE(pending_contributions.count, 0),
    'average_contribution', CASE 
      WHEN COALESCE(paid_contributions.count, 0) > 0 THEN COALESCE(paid_sum.total, 0) / paid_contributions.count
      ELSE 0
    END
  ) INTO campaign_data
  FROM public.specific_campaigns c
  LEFT JOIN (
    SELECT campaign_id, SUM(amount) as total
    FROM public.specific_contributions 
    WHERE status = 'paid' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) paid_sum ON c.id = paid_sum.campaign_id
  LEFT JOIN (
    SELECT campaign_id, SUM(amount) as total
    FROM public.specific_contributions 
    WHERE status = 'pending' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) pending_sum ON c.id = pending_sum.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM public.specific_contributions 
    WHERE campaign_id = _campaign_id
    GROUP BY campaign_id
  ) total_contributors ON c.id = total_contributors.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM public.specific_contributions 
    WHERE status = 'paid' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) paid_contributors ON c.id = paid_contributors.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM public.specific_contributions 
    WHERE status = 'pending' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) pending_contributors ON c.id = pending_contributors.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM public.specific_contributions 
    WHERE status = 'paid' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) paid_contributions ON c.id = paid_contributions.campaign_id
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as count
    FROM public.specific_contributions 
    WHERE status = 'pending' AND campaign_id = _campaign_id
    GROUP BY campaign_id
  ) pending_contributions ON c.id = pending_contributions.campaign_id
  WHERE c.id = _campaign_id AND c.condominium_id = _condominium_id;

  -- Get contributions data with resident info, ordered correctly
  SELECT json_agg(
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
  ) INTO contributions_data
  FROM public.specific_contributions sc
  JOIN public.residents r ON sc.resident_id = r.id
  JOIN public.profiles p ON r.profile_id = p.id
  WHERE sc.campaign_id = _campaign_id AND sc.condominium_id = _condominium_id;

  -- Build final result
  result := json_build_object(
    'campaign', campaign_data,
    'contributions', COALESCE(contributions_data, '[]'::json)
  );

  RETURN result;
END;
$function$;