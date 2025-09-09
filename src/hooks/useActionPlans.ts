import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ActionPlan {
  id: string;
  condominium_id: string;
  task_number: number;
  title: string;
  description?: string;
  notes?: string;
  category: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  completion_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
}

interface ActionPlanInsert {
  title: string;
  description?: string;
  notes?: string;
  category?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

interface ActionPlanUpdate {
  title?: string;
  description?: string;
  notes?: string;
  category?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  completion_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

export function useActionPlans() {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchActionPlans = async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('action_plans')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActionPlans(data || []);
    } catch (error) {
      console.error('Error fetching action plans:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos de ação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createActionPlan = async (data: Omit<ActionPlanInsert, 'condominium_id' | 'created_by'>) => {
    if (!profile?.condominium_id || !profile.user_id) return null;

    try {
      const insertData = {
        ...data,
        condominium_id: profile.condominium_id,
        created_by: profile.user_id,
      };
      
      const { data: newActionPlan, error } = await supabase
        .from('action_plans')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de ação criado com sucesso.",
      });

      await fetchActionPlans();
      return newActionPlan;
    } catch (error) {
      console.error('Error creating action plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano de ação.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateActionPlan = async (id: string, data: ActionPlanUpdate) => {
    try {
      const { error } = await supabase
        .from('action_plans')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de ação atualizado com sucesso.",
      });

      await fetchActionPlans();
      return true;
    } catch (error) {
      console.error('Error updating action plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano de ação.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteActionPlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('action_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de ação excluído com sucesso.",
      });

      await fetchActionPlans();
      return true;
    } catch (error) {
      console.error('Error deleting action plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano de ação.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchActionPlans();
  }, [profile?.condominium_id]);

  return {
    actionPlans,
    loading,
    fetchActionPlans,
    createActionPlan,
    updateActionPlan,
    deleteActionPlan,
  };
}