-- Check if campaign_analytics is a view or table
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'campaign_analytics';

-- Create a function to refresh campaign analytics data
CREATE OR REPLACE FUNCTION refresh_campaign_analytics(_condominium_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- This function will be called by triggers to update analytics
  REFRESH MATERIALIZED VIEW IF EXISTS campaign_analytics;
$$;

-- Create triggers to refresh analytics when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_campaign_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- For now, just log the change - we'll handle refresh differently
  RAISE LOG 'Campaign/Contribution data changed, analytics may need refresh';
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS refresh_analytics_on_campaign_change ON specific_campaigns;
DROP TRIGGER IF EXISTS refresh_analytics_on_contribution_change ON specific_contributions;

-- Create new triggers
CREATE TRIGGER refresh_analytics_on_campaign_change
  AFTER INSERT OR UPDATE OR DELETE ON specific_campaigns
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_campaign_analytics();

CREATE TRIGGER refresh_analytics_on_contribution_change  
  AFTER INSERT OR UPDATE OR DELETE ON specific_contributions
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_campaign_analytics();