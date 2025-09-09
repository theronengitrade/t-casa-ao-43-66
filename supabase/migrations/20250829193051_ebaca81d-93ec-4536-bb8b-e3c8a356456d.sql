-- Ensure realtime is enabled for payments table
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER publication supabase_realtime ADD TABLE public.payments;