import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ActionPlanHistory {
  id: string;
  action_plan_id: string;
  condominium_id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_at: string;
  changed_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

export function useActionPlanHistory(actionPlanId?: string) {
  const [history, setHistory] = useState<ActionPlanHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!actionPlanId || !profile?.condominium_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('action_plan_history')
        .select('*')
        .eq('action_plan_id', actionPlanId)
        .eq('condominium_id', profile.condominium_id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately to avoid relation issues
      const historyWithProfiles = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', item.changed_by)
            .single();
            
          return {
            ...item,
            changed_by_profile: profileData || null
          };
        })
      );
      
      setHistory(historyWithProfiles);
    } catch (error) {
      console.error('Error fetching action plan history:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico do plano de ação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (actionPlanId) {
      fetchHistory();
    }
  }, [actionPlanId, profile?.condominium_id]);

  return {
    history,
    loading,
    fetchHistory,
  };
}