import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResidentSyncOptions {
  onDataChange?: () => void;
  condominiumId?: string;
  profileId?: string;
}

/**
 * Hook especializado para sincronização de dados entre perfis de residentes
 * Monitora alterações nas tabelas residents e profiles em tempo real
 */
export const useResidentSync = ({ onDataChange, condominiumId, profileId }: ResidentSyncOptions = {}) => {
  const { toast } = useToast();

  const handleResidentUpdate = useCallback(async (payload: any) => {
    console.log('🔄 Resident data synchronized:', payload);
    console.log('🔍 Payload details:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      new: payload.new,
      old: payload.old
    });
    
    // Dispara callback para atualizar UI
    if (onDataChange) {
      console.log('📢 Triggering onDataChange callback for residents');
      onDataChange();
    }

    // Exibe notificação de sincronização
    if (payload.eventType === 'UPDATE') {
      toast({
        title: "Dados sincronizados",
        description: "As informações do residente foram atualizadas em tempo real",
        duration: 2000
      });
    }
  }, [onDataChange, toast]);

  const handleProfileUpdate = useCallback(async (payload: any) => {
    console.log('🔄 Profile data synchronized:', payload);
    console.log('🔍 Profile payload details:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      new: payload.new,
      old: payload.old
    });
    
    // Dispara callback para atualizar UI
    if (onDataChange) {
      console.log('📢 Triggering onDataChange callback for profiles');
      onDataChange();
    }
  }, [onDataChange]);

  useEffect(() => {
    if (!condominiumId && !profileId) return;

    let channels: any[] = [];

    // Canal para tabela residents (filtrado por condomínio)
    if (condominiumId) {
      const residentsChannel = supabase
        .channel('residents_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'residents',
            filter: `condominium_id=eq.${condominiumId}`
          },
          handleResidentUpdate
        )
        .subscribe();

      channels.push(residentsChannel);
    }

    // Canal para tabela profiles (filtrado por condomínio ou perfil específico)
    if (condominiumId) {
      const profilesChannel = supabase
        .channel('profiles_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `condominium_id=eq.${condominiumId}`
          },
          handleProfileUpdate
        )
        .subscribe();

      channels.push(profilesChannel);
    } else if (profileId) {
      const singleProfileChannel = supabase
        .channel('single_profile_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${profileId}`
          },
          handleProfileUpdate
        )
        .subscribe();

      channels.push(singleProfileChannel);
    }

    // Canal para tabela expenses (filtrado por condomínio)
    if (condominiumId) {
      const expensesChannel = supabase
        .channel('expenses_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `condominium_id=eq.${condominiumId}`
          },
          handleResidentUpdate
        )
        .subscribe();

      channels.push(expensesChannel);
    }

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [condominiumId, profileId, handleResidentUpdate, handleProfileUpdate]);

  // Função para forçar sincronização manual
  const forcSync = useCallback(async () => {
    if (onDataChange) {
      console.log('🔄 Manual sync triggered');
      onDataChange();
    }
  }, [onDataChange]);

  return {
    forcSync
  };
};