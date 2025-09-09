import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDataSync() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Sync announcements
  useRealTimeSync({
    table: 'announcements',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Novo comunicado disponível');
    },
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });

  // Sync action plans
  useRealTimeSync({
    table: 'action_plans',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
      toast.success('Novo plano de ação criado');
    },
    onUpdate: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
      
      // Notify about status changes
      if (payload.old.status !== payload.new.status) {
        toast.success(`Plano de ação ${payload.new.task_number} atualizado: ${payload.new.status}`);
      }
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    }
  });

  // Sync expenses
  useRealTimeSync({
    table: 'expenses',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Nova despesa registrada');
    },
    onUpdate: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      // Notify about approval status changes
      if (payload.old.status !== payload.new.status) {
        toast.success(`Despesa ${payload.new.status}`);
      }
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  // Sync payments
  useRealTimeSync({
    table: 'payments',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onUpdate: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      // Notify residents about payment confirmations
      if (payload.old.status !== payload.new.status && payload.new.status === 'paid') {
        toast.success('Pagamento confirmado');
      }
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });

  // Sync residents
  useRealTimeSync({
    table: 'residents',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Novo residente registrado');
    },
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    }
  });

  // Sync visitors
  useRealTimeSync({
    table: 'visitors',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
    onUpdate: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      
      // Notify about visitor approvals
      if (payload.old.approved !== payload.new.approved && payload.new.approved) {
        toast.success(`Visitante ${payload.new.name} aprovado`);
      }
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    }
  });

  // Sync occurrences
  useRealTimeSync({
    table: 'occurrences',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      toast.success('Nova ocorrência registrada');
    },
    onUpdate: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      
      // Notify about status changes
      if (payload.old.status !== payload.new.status) {
        toast.success(`Ocorrência ${payload.new.occurrence_number} ${payload.new.status}`);
      }
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    }
  });

  // Sync documents
  useRealTimeSync({
    table: 'documents',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Novo documento disponível');
    },
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onDelete: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  return null;
}