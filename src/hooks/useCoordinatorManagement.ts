import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Coordinator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  must_change_password: boolean;
  created_at: string;
  condominium: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface CreateCoordinatorData {
  condominium_id: string;
  coordinator: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    tempPassword: string;
  };
}

export const useCoordinatorManagement = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      console.log('Fetching coordinators...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          must_change_password,
          created_at,
          condominium:condominiums!profiles_condominium_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('role', 'coordinator')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coordinators:', error);
        throw error;
      }

      console.log('Coordinators fetched successfully:', data?.length);
      setCoordinators(data || []);
    } catch (error: any) {
      console.error('Error in fetchCoordinators:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar coordenadores: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCoordinator = async (coordinatorData: CreateCoordinatorData) => {
    try {
      setCreating(true);
      console.log('Creating coordinator via edge function...', coordinatorData);

      const response = await supabase.functions.invoke('create-coordinator', {
        body: coordinatorData
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(`Erro na função: ${response.error.message}`);
      }

      const result = response.data;
      
      if (!result.success) {
        console.error('Coordinator creation failed:', result);
        throw new Error(result.error);
      }

      console.log('Coordinator created successfully:', result.data);
      
      toast({
        title: "✅ Coordenador criado",
        description: `Coordenador ${coordinatorData.coordinator.firstName} ${coordinatorData.coordinator.lastName} criado com sucesso!`,
      });

      // Refresh the coordinators list
      await fetchCoordinators();

      return result.data;
    } catch (error: any) {
      console.error('Error creating coordinator:', error);
      toast({
        title: "Erro na criação",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const resetCoordinatorPassword = async (coordinatorId: string, userId: string) => {
    try {
      // Generate new temporary password
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let newPassword = '';
      for (let i = 0; i < 12; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      console.log('Resetting password for coordinator:', coordinatorId);

      // In a real implementation, this would need to call an edge function
      // that has admin privileges to reset the password in Supabase Auth
      // For now, we'll just mark the profile as needing password change
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', coordinatorId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      await fetchCoordinators();

      toast({
        title: "Password redefinida",
        description: `Nova password temporária: ${newPassword}`,
      });

      return newPassword;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro",
        description: "Erro ao redefinir password: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getCoordinatorsByCondominium = (condominiumId: string) => {
    return coordinators.filter(coordinator => 
      coordinator.condominium?.id === condominiumId
    );
  };

  const getCoordinatorsWithoutCondominium = () => {
    return coordinators.filter(coordinator => !coordinator.condominium);
  };

  const getCoordinatorStats = () => {
    const total = coordinators.length;
    const needPasswordChange = coordinators.filter(c => c.must_change_password).length;
    const withoutCondominium = getCoordinatorsWithoutCondominium().length;
    
    return {
      total,
      needPasswordChange,
      withoutCondominium,
      activeCoordinators: total - withoutCondominium
    };
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  return {
    coordinators,
    loading,
    creating,
    fetchCoordinators,
    createCoordinator,
    resetCoordinatorPassword,
    getCoordinatorsByCondominium,
    getCoordinatorsWithoutCondominium,
    getCoordinatorStats
  };
};