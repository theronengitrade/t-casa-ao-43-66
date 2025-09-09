-- Create cities table for grouping condominiums
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'Angola',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create condominium_cities junction table for assigning condominiums to cities
CREATE TABLE public.condominium_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, city_id)
);

-- Enable RLS on both tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominium_cities ENABLE ROW LEVEL SECURITY;

-- RLS policies for cities (only super admins can manage)
CREATE POLICY "Super admins can manage all cities" 
ON public.cities 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- RLS policies for condominium_cities (only super admins can manage)
CREATE POLICY "Super admins can manage condominium city assignments" 
ON public.condominium_cities 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Add indexes for better performance
CREATE INDEX idx_condominium_cities_condominium_id ON public.condominium_cities(condominium_id);
CREATE INDEX idx_condominium_cities_city_id ON public.condominium_cities(city_id);
CREATE INDEX idx_cities_name ON public.cities(name);

-- Insert some default cities
INSERT INTO public.cities (name, country, created_by) VALUES 
('Luanda', 'Angola', auth.uid()),
('Maputo', 'Moçambique', auth.uid()),
('Benguela', 'Angola', auth.uid()),
('Huambo', 'Angola', auth.uid());