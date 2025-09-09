-- Create action_plans table
CREATE TABLE public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  category TEXT NOT NULL DEFAULT 'manutencao' CHECK (category IN ('manutencao', 'seguranca', 'limpeza', 'obra', 'outro')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  due_date DATE,
  completion_date DATE,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, task_number)
);

-- Create action_plan_history table
CREATE TABLE public.action_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for action_plans
CREATE POLICY "Multi-tenant access for action_plans" 
ON public.action_plans 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create RLS policies for action_plan_history
CREATE POLICY "Multi-tenant access for action_plan_history" 
ON public.action_plan_history 
FOR ALL 
USING (condominium_id = get_user_condominium(auth.uid()));

-- Create function to get next task number
CREATE OR REPLACE FUNCTION public.get_next_task_number(_condominium_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(task_number), 0) + 1 
  INTO _next_number
  FROM public.action_plans 
  WHERE condominium_id = _condominium_id;
  
  RETURN _next_number;
END;
$$;

-- Create trigger function for action plans
CREATE OR REPLACE FUNCTION public.set_task_number_and_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set task number if not provided
  IF NEW.task_number IS NULL THEN
    NEW.task_number := get_next_task_number(NEW.condominium_id);
  END IF;
  
  -- Update timestamp
  NEW.updated_at := now();
  
  -- Log changes to history on UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Check for status change
    IF OLD.status != NEW.status THEN
      INSERT INTO public.action_plan_history (
        action_plan_id, condominium_id, field_changed, 
        old_value, new_value, changed_by
      ) VALUES (
        NEW.id, NEW.condominium_id, 'status',
        OLD.status, NEW.status, auth.uid()
      );
    END IF;
    
    -- Set completion date when status changes to concluido
    IF NEW.status = 'concluido' AND OLD.status != 'concluido' THEN
      NEW.completion_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER action_plans_timestamp_trigger
  BEFORE INSERT OR UPDATE ON public.action_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_number_and_timestamps();

-- Create indexes for better performance
CREATE INDEX idx_action_plans_condominium_id ON public.action_plans(condominium_id);
CREATE INDEX idx_action_plans_status ON public.action_plans(status);
CREATE INDEX idx_action_plans_assigned_to ON public.action_plans(assigned_to);
CREATE INDEX idx_action_plan_history_action_plan_id ON public.action_plan_history(action_plan_id);
CREATE INDEX idx_action_plan_history_condominium_id ON public.action_plan_history(condominium_id);