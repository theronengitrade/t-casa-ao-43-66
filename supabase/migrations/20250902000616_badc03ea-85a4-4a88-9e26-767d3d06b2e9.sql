-- Enable realtime for specific_campaigns and specific_contributions tables
ALTER TABLE public.specific_campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.specific_contributions REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.specific_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.specific_contributions;