import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RealtimeSyncOptions {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
}

export function useRealTimeSync(options: RealtimeSyncOptions) {
  const { profile } = useAuth();
  
  const handleRealtimeEvent = useCallback((event: string, payload: any) => {
    console.log(`[REALTIME] ${event} on ${options.table}:`, payload);
    
    switch (event) {
      case 'INSERT':
        options.onInsert?.(payload);
        break;
      case 'UPDATE':
        options.onUpdate?.(payload);
        break;
      case 'DELETE':
        options.onDelete?.(payload);
        break;
    }
  }, [options]);

  useEffect(() => {
    if (!profile?.condominium_id) return;

    const channelName = `${options.table}-${profile.condominium_id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: options.table,
          filter: options.filter || `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => handleRealtimeEvent('INSERT', payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: options.table,
          filter: options.filter || `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => handleRealtimeEvent('UPDATE', payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: options.table,
          filter: options.filter || `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => handleRealtimeEvent('DELETE', payload)
      )
      .subscribe((status) => {
        console.log(`[REALTIME] Channel ${channelName} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Real-time sync enabled for ${options.table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Real-time sync failed for ${options.table}`);
          toast.error(`Erro na sincronização em tempo real: ${options.table}`);
        }
      });

    return () => {
      console.log(`[REALTIME] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [profile?.condominium_id, options.table, options.filter, handleRealtimeEvent]);

  return null;
}