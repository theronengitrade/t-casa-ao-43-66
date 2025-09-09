-- Create table for space reservations
CREATE TABLE public.space_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominium_id UUID NOT NULL,
  resident_id UUID NOT NULL,
  space_name TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.space_reservations ENABLE ROW LEVEL SECURITY;

-- Create multi-tenant RLS policy
CREATE POLICY "Multi-tenant access for space_reservations" 
ON public.space_reservations 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_space_reservations_updated_at
BEFORE UPDATE ON public.space_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();