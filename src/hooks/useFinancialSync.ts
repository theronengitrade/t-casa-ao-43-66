import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FinancialStats {
  // Dados de receita do ano atual
  receita_atual: number;
  despesas_atual: number; // Manter para compatibilidade, mas usar despesas_aprovadas
  despesas_aprovadas: number; // Campo correto da função
  saldo_disponivel: number;
  remanescente_total: number;
  
  // Dados mensais atuais
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  currentMonthlyFee: number;
  
  // Meta dados
  currentMonth: number;
  currentYear: number;
  ano_atual: number;
}

export interface PaymentData {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  reference_month: string;
  due_date: string;
  payment_date: string | null;
  description: string;
  currency: string;
  resident_id: string;
  condominium_id: string;
  created_at: string;
  residents?: {
    id: string;
    apartment_number: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

/**
 * Hook unificado para sincronização de dados financeiros
 * Garante consistência total entre portal do coordenador e residente
 */
export const useFinancialSync = (condominiumId?: string, selectedMonth?: number, selectedYear?: number) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<FinancialStats>({
    receita_atual: 0,
    despesas_atual: 0,
    despesas_aprovadas: 0,
    saldo_disponivel: 0,
    remanescente_total: 0,
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0,
    currentMonthlyFee: 0,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    ano_atual: new Date().getFullYear()
  });
  
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para normalizar e corrigir dados de pagamento
  const normalizePaymentData = (rawPayments: any[]): PaymentData[] => {
    return rawPayments.map(payment => {
      // ✅ CORREÇÃO INTELIGENTE: Extrair mês correto da descrição
      const [yearStr, monthStr] = payment.reference_month.split('-');
      const paymentYear = parseInt(yearStr);
      let paymentMonth = parseInt(monthStr);
      
      // Cross-reference com description para correção
      const description = payment.description?.toLowerCase() || '';
      const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      
      monthNames.forEach((monthName, index) => {
        if (description.includes(monthName)) {
          paymentMonth = index + 1;
        }
      });

      // Status correction - check if overdue
      let finalStatus = payment.status;
      if (payment.status === 'pending' && new Date(payment.due_date) < new Date()) {
        finalStatus = 'overdue';
      }

      return {
        ...payment,
        reference_month: `${paymentYear}-${String(paymentMonth).padStart(2, '0')}-01`,
        status: finalStatus,
        amount: parseFloat(payment.amount)
      };
    });
  };

  // Função unificada para buscar dados financeiros
  const fetchUnifiedFinancialData = async () => {
    if (!condominiumId) return;

    try {
      setLoading(true);

      console.log('🔄 FinancialSync - Fetching unified financial data:', {
        condominiumId,
        selectedMonth: selectedMonth || new Date().getMonth(),
        selectedYear: selectedYear || new Date().getFullYear()
      });

      // 1. Buscar saldo disponível usando função do banco
      const { data: saldoData, error: saldoError } = await supabase.rpc('obter_saldo_disponivel', {
        _condominium_id: condominiumId
      });

      if (saldoError) throw saldoError;

      // 2. Buscar quota mensal atual
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .select('current_monthly_fee, currency')
        .eq('id', condominiumId)
        .single();

      if (condoError) throw condoError;

      // 3. Buscar todos os pagamentos para o mês selecionado
      const { data: rawPayments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          residents(
            id,
            apartment_number,
            profiles(first_name, last_name)
          )
        `)
        .eq('condominium_id', condominiumId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // 4. Normalizar e filtrar pagamentos
      const normalizedPayments = normalizePaymentData(rawPayments || []);
      
      // Filtrar por mês/ano se especificado
      const targetMonth = selectedMonth ?? new Date().getMonth();
      const targetYear = selectedYear ?? new Date().getFullYear();
      
      const filteredPayments = normalizedPayments.filter(payment => {
        const paymentDate = new Date(payment.reference_month);
        return paymentDate.getMonth() === targetMonth && 
               paymentDate.getFullYear() === targetYear;
      });

      console.log('✅ FinancialSync - Processed payments:', {
        total: normalizedPayments.length,
        filtered: filteredPayments.length,
        target: { month: targetMonth + 1, year: targetYear }
      });

      // 5. Calcular estatísticas
      const totalReceived = filteredPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalPending = filteredPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalOverdue = filteredPayments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);

      // 6. Atualizar estado unificado
      const saldoDataTyped = saldoData as any;
      const unifiedStats: FinancialStats = {
        receita_atual: saldoDataTyped?.receita_atual || 0,
        despesas_atual: saldoDataTyped?.despesas_aprovadas || 0, // Para compatibilidade
        despesas_aprovadas: saldoDataTyped?.despesas_aprovadas || 0, // Campo correto
        saldo_disponivel: saldoDataTyped?.saldo_disponivel || 0,
        remanescente_total: saldoDataTyped?.remanescente_total || 0,
        totalReceived,
        totalPending,
        totalOverdue,
        currentMonthlyFee: condoData.current_monthly_fee || 0,
        currentMonth: targetMonth + 1,
        currentYear: targetYear,
        ano_atual: saldoDataTyped?.ano_atual || new Date().getFullYear()
      };

      setStats(unifiedStats);
      setPayments(filteredPayments);

      console.log('✅ FinancialSync - Unified stats calculated:', unifiedStats);

    } catch (error) {
      console.error('❌ FinancialSync - Error fetching data:', error);
      toast({
        title: "Erro de Sincronização",
        description: "Erro ao sincronizar dados financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para atualização manual
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchUnifiedFinancialData();
      toast({
        title: "Sincronizado",
        description: "Dados financeiros atualizados com sucesso"
      });
    } catch (error) {
      console.error('Error refreshing financial data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Setup de subscriptions em tempo real
  useEffect(() => {
    if (!condominiumId) return;

    console.log('🔄 FinancialSync - Setting up realtime subscriptions');

    const paymentsChannel = supabase
      .channel(`financial-sync-payments-${condominiumId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `condominium_id=eq.${condominiumId}`
        },
        (payload) => {
          console.log('🔄 FinancialSync - Payment change detected:', payload.eventType);
          setTimeout(() => fetchUnifiedFinancialData(), 100);
        }
      )
      .subscribe();

    const condoChannel = supabase
      .channel(`financial-sync-condo-${condominiumId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'condominiums',
          filter: `id=eq.${condominiumId}`
        },
        (payload) => {
          console.log('🔄 FinancialSync - Condominium updated:', payload);
          setTimeout(() => fetchUnifiedFinancialData(), 100);
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel(`financial-sync-expenses-${condominiumId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `condominium_id=eq.${condominiumId}`
        },
        (payload) => {
          console.log('🔄 FinancialSync - Expense change detected:', payload.eventType);
          setTimeout(() => fetchUnifiedFinancialData(), 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 FinancialSync - Cleaning up subscriptions');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(condoChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [condominiumId]);

  // Buscar dados quando dependências mudarem
  useEffect(() => {
    fetchUnifiedFinancialData();
  }, [condominiumId, selectedMonth, selectedYear]);

  // Função para marcar pagamento como pago
  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento confirmado como pago"
      });

      // A atualização será feita automaticamente via realtime
    } catch (error: any) {
      console.error('Error marking payment as paid:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pagamento",
        variant: "destructive"
      });
    }
  };

  return {
    stats,
    payments,
    loading,
    refreshing,
    refreshData,
    markPaymentAsPaid,
    fetchUnifiedFinancialData
  };
};