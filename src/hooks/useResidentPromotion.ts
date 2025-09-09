import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ResidentForPromotion {
  id: string;
  apartment_number: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    coordination_staff_id: string | null;
  };
}

type CoordinationRole = 'coordinator' | 'financial' | 'security' | 'maintenance' | 'administration' | 'secretary';

interface PromotionResult {
  success: boolean;
  error?: string;
  coordination_staff_id?: string;
  message?: string;
}

export const useResidentPromotion = () => {
  const [residents, setResidents] = useState<ResidentForPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchResidents = async () => {
    if (!profile?.condominium_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          profile:profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            coordination_staff_id
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('apartment_number');

      if (error) throw error;
      setResidents(data || []);
    } catch (error: any) {
      console.error('Error fetching residents for promotion:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar residentes: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteResident = async (
    residentId: string, 
    role: CoordinationRole, 
    position: string, 
    hasSystemAccess: boolean = true
  ) => {
    try {
      const { data, error } = await supabase.rpc('promote_resident_to_coordination', {
        _resident_id: residentId,
        _role: role,
        _position: position,
        _has_system_access: hasSystemAccess
      });

      if (error) throw error;

      const result = data as unknown as PromotionResult;
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      toast({
        title: "Sucesso",
        description: "Residente promovido à coordenação com sucesso!"
      });

      // Refresh the list
      await fetchResidents();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao promover residente: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const removeFromCoordination = async (coordinationStaffId: string) => {
    try {
      const { data, error } = await supabase.rpc('remove_from_coordination', {
        _coordination_staff_id: coordinationStaffId
      });

      if (error) throw error;

      const result = data as unknown as PromotionResult;
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      toast({
        title: "Sucesso",
        description: "Membro removido da coordenação com sucesso!"
      });

      // Refresh the list
      await fetchResidents();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover membro: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getAvailableResidents = () => {
    return residents.filter(resident => !resident.profile.coordination_staff_id);
  };

  const getCoordinationMembers = () => {
    return residents.filter(resident => resident.profile.coordination_staff_id);
  };

  useEffect(() => {
    fetchResidents();
  }, [profile?.condominium_id]);

  return {
    residents,
    loading,
    fetchResidents,
    promoteResident,
    removeFromCoordination,
    getAvailableResidents,
    getCoordinationMembers
  };
};