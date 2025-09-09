import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CoordinationMember {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  role: 'coordinator' | 'financial' | 'security' | 'maintenance' | 'administration' | 'secretary';
  has_system_access: boolean;
  assigned_date: string;
  created_at: string;
  condominium_id: string;
  created_by: string;
  user_id?: string | null;
  permissions?: any;
}

export interface CreateCoordinationMemberData {
  name: string;
  position: string;
  phone?: string;
  role: CoordinationMember['role'];
  has_system_access: boolean;
  assigned_date: string;
}

export const useCoordinationStaff = () => {
  const [members, setMembers] = useState<CoordinationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coordination_staff')
        .select('*')
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setMembers((data || []) as CoordinationMember[]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da coordenação: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMember = async (memberData: CreateCoordinationMemberData) => {
    try {
      if (!profile?.condominium_id) {
        throw new Error('Condomínio não encontrado');
      }

      const insertData = {
        ...memberData,
        condominium_id: profile.condominium_id,
        created_by: profile.user_id
      };

      const { data, error } = await supabase
        .from('coordination_staff')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Adiciona imediatamente à lista local para atualização instantânea
      const newMember = data as CoordinationMember;
      setMembers(prevMembers => [newMember, ...prevMembers]);

      toast({
        title: "Sucesso",
        description: "Membro da coordenação adicionado com sucesso!"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar membro: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateMember = async (id: string, updates: Partial<CoordinationMember>) => {
    try {
      const { data, error } = await supabase
        .from('coordination_staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualiza imediatamente na lista local
      const updatedMember = data as CoordinationMember;
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === id ? updatedMember : member
        )
      );

      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coordination_staff')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove imediatamente da lista local
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== id)
      );

      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover membro: " + error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember
  };
};