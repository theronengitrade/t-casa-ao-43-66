import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { toast } from 'sonner';

interface CoordinationMember {
  id: string;
  name: string;
  position: string;
  role: string;
  has_system_access: boolean;
  user_id: string | null;
  condominium_id: string;
  permissions: any;
}

export function useCoordinationSync() {
  const { profile, user } = useAuth();
  const [coordinationMembers, setCoordinationMembers] = useState<CoordinationMember[]>([]);
  const [userPermissions, setUserPermissions] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch coordination members
  const fetchCoordinationMembers = useCallback(async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('coordination_staff')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoordinationMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching coordination members:', error);
      toast.error('Erro ao carregar membros da coordenação');
    }
  }, [profile?.condominium_id]);

  // Fetch user permissions
  const fetchUserPermissions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_coordination_member_permissions', {
        _user_id: user.id
      });

      if (error) throw error;

      setUserPermissions(data || {});
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCoordinationMembers(),
        fetchUserPermissions()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchCoordinationMembers, fetchUserPermissions]);

  // Real-time sync for coordination_staff
  useRealTimeSync({
    table: 'coordination_staff',
    onInsert: (payload) => {
      setCoordinationMembers(prev => [payload.new, ...prev]);
      toast.success('Novo membro da coordenação adicionado');
    },
    onUpdate: (payload) => {
      setCoordinationMembers(prev => 
        prev.map(member => 
          member.id === payload.new.id ? payload.new : member
        )
      );
      
      // If current user was updated, refresh permissions
      if (payload.new.user_id === user?.id) {
        fetchUserPermissions();
        toast.success('Suas permissões foram atualizadas');
      }
    },
    onDelete: (payload) => {
      setCoordinationMembers(prev => 
        prev.filter(member => member.id !== payload.old.id)
      );
      
      // If current user was removed, refresh permissions
      if (payload.old.user_id === user?.id) {
        fetchUserPermissions();
        toast.warning('Você foi removido da coordenação');
      }
    }
  });

  // Real-time sync for profiles (to catch role changes)
  useRealTimeSync({
    table: 'profiles',
    filter: `user_id=eq.${user?.id}`,
    onUpdate: (payload) => {
      // Refresh permissions if profile was updated
      if (payload.new.coordination_staff_id !== payload.old.coordination_staff_id) {
        fetchUserPermissions();
        toast.success('Seu perfil de coordenação foi atualizado');
      }
    }
  });

  // Helper function to check permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!userPermissions) return false;
    
    // Super admin and coordinator have all permissions
    if (userPermissions.all === true) return true;
    
    // Check specific permission
    return userPermissions[permission] === true;
  }, [userPermissions]);

  // Helper function to get user's coordination role
  const getUserCoordinationRole = useCallback((): string | null => {
    if (!user?.id) return null;
    
    const member = coordinationMembers.find(m => m.user_id === user.id);
    return member?.role || null;
  }, [coordinationMembers, user?.id]);

  return {
    coordinationMembers,
    userPermissions,
    isLoading,
    hasPermission,
    getUserCoordinationRole,
    refresh: () => {
      fetchCoordinationMembers();
      fetchUserPermissions();
    }
  };
}