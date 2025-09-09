import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Home, 
  CreditCard, 
  Bell, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRemanescenteAnual } from '@/hooks/useRemanescenteAnual';
import { RemanescenteCard } from '@/components/shared/RemanescenteCard';
import { useFinancialSync } from '@/hooks/useFinancialSync';

interface ResidentDashboardOverviewProps {
  profile: any;
  condominiumInfo: any;
  onNavigate: (tab: string) => void;
}

interface ResidentStats {
  myPayments: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    currentMonthAmount: number;
    currentMonthStatus: string;
  };
  myVisitors: {
    pending: number;
    approved: number;
    total: number;
  };
  announcements: {
    unread: number;
    urgent: number;
    total: number;
  };
  contributions: {
    total: number;
    amount: number;
    pending: number;
  };
}

export default function ResidentDashboardOverview({ 
  profile, 
  condominiumInfo, 
  onNavigate 
}: ResidentDashboardOverviewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ResidentStats>({
    myPayments: {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      currentMonthAmount: 0,
      currentMonthStatus: 'pending'
    },
    myVisitors: {
      pending: 0,
      approved: 0,
      total: 0
    },
    announcements: {
      unread: 0,
      urgent: 0,
      total: 0
    },
    contributions: {
      total: 0,
      amount: 0,
      pending: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [residentData, setResidentData] = useState<any>(null);

  const { saldoData, loading: remanescenteLoading } = useRemanescenteAnual(condominiumInfo?.id);
  
  // ✅ SINCRONIZAÇÃO UNIFICADA: Hook centralizado para dados financeiros
  const { 
    stats: financialStats, 
    payments: allPayments, 
    loading: financialLoading,
    refreshData: refreshFinancialData 
  } = useFinancialSync(profile?.condominium_id);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [profile]);

  // ✅ CORREÇÃO CRÍTICA: Re-sincronizar quando dados financeiros chegarem
  useEffect(() => {
    if (residentData?.id && allPayments.length > 0 && !financialLoading) {
      console.log('🔄 RESYNC: Dados financeiros prontos, re-calculando stats de pagamento');
      fetchPaymentStats(residentData.id);
    }
  }, [allPayments, financialLoading, residentData?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar dados do residente
      const { data: resident, error: residentError } = await supabase
        .from('residents')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (residentError) throw residentError;
      setResidentData(resident);

      // Buscar estatísticas em paralelo
      await Promise.all([
        fetchPaymentStats(resident.id),
        fetchVisitorStats(resident.id),
        fetchAnnouncementStats(),
        fetchContributionStats(resident.id)
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async (residentId: string) => {
    try {
      console.log('🔄 SINCRONIZAÇÃO UNIFICADA: Usando dados do useFinancialSync', {
        residentId,
        allPaymentsCount: allPayments.length,
        financialLoading,
        hasFinancialStats: !!financialStats
      });
      
      // ✅ VERIFICAÇÃO CRÍTICA: Garantir que os dados estão disponíveis
      if (financialLoading || allPayments.length === 0) {
        console.warn('⚠️ Dados financeiros ainda não disponíveis, aguardando...');
        return;
      }
      
      // ✅ CORREÇÃO TOTAL: Filtrar pagamentos do residente dos dados sincronizados
      const residentPayments = allPayments.filter(payment => 
        payment.resident_id === residentId
      );

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // ✅ USAR STATS JÁ CALCULADOS DO HOOK UNIFICADO + FILTRO ESPECÍFICO
      const paymentStats = {
        total: residentPayments.length,
        paid: residentPayments.filter(p => p.status === 'paid').length,
        pending: residentPayments.filter(p => p.status === 'pending').length,
        overdue: residentPayments.filter(p => p.status === 'overdue').length,
        currentMonthAmount: financialStats.currentMonthlyFee || 0,
        currentMonthStatus: 'pending'
      };

      // ✅ LÓGICA CONSISTENTE: Verificar pagamento do mês atual
      const currentMonthPayment = residentPayments.find(payment => {
        const paymentDate = new Date(payment.reference_month);
        return paymentDate.getMonth() + 1 === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      });

      if (currentMonthPayment) {
        paymentStats.currentMonthAmount = currentMonthPayment.amount;
        paymentStats.currentMonthStatus = currentMonthPayment.status;
      }

      console.log('✅ SINCRONIZAÇÃO: Stats calculados com dados unificados:', {
        paymentStats,
        currentMonthPayment,
        residentPaymentsCount: residentPayments.length
      });
      setStats(prev => ({ ...prev, myPayments: paymentStats }));
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const fetchVisitorStats = async (residentId: string) => {
    try {
      const { data: visitors, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('resident_id', residentId);

      if (error) throw error;

      const visitorStats = {
        total: visitors?.length || 0,
        pending: visitors?.filter(v => !v.approved).length || 0,
        approved: visitors?.filter(v => v.approved).length || 0
      };

      setStats(prev => ({ ...prev, myVisitors: visitorStats }));
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    }
  };

  const fetchAnnouncementStats = async () => {
    try {
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('published', true);

      if (error) throw error;

      const announcementStats = {
        total: announcements?.length || 0,
        urgent: announcements?.filter(a => a.is_urgent).length || 0,
        unread: announcements?.length || 0 // Para simplificar, consideramos todos como não lidos
      };

      setStats(prev => ({ ...prev, announcements: announcementStats }));
    } catch (error) {
      console.error('Error fetching announcement stats:', error);
    }
  };

  const fetchContributionStats = async (residentId: string) => {
    try {
      const { data: contributions, error } = await supabase
        .from('specific_contributions')
        .select('*')
        .eq('resident_id', residentId);

      if (error) throw error;

      const contributionStats = {
        total: contributions?.length || 0,
        amount: contributions
          ?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0,
        pending: contributions
          ?.filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0
      };

      setStats(prev => ({ ...prev, contributions: contributionStats }));
    } catch (error) {
      console.error('Error fetching contribution stats:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!profile?.condominium_id || !residentData?.id) return;

    const channels: any[] = [];

    // Subscription para pagamentos
    const paymentsChannel = supabase
      .channel(`resident-payments-${residentData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `resident_id=eq.${residentData.id}`
        },
        () => {
          fetchPaymentStats(residentData.id);
        }
      )
      .subscribe();

    // Subscription para visitantes
    const visitorsChannel = supabase
      .channel(`resident-visitors-${residentData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitors',
          filter: `resident_id=eq.${residentData.id}`
        },
        () => {
          fetchVisitorStats(residentData.id);
        }
      )
      .subscribe();

    // Subscription para anúncios
    const announcementsChannel = supabase
      .channel(`resident-announcements-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        () => {
          fetchAnnouncementStats();
        }
      )
      .subscribe();

    channels.push(paymentsChannel, visitorsChannel, announcementsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 REFRESH SINCRONIZADO: Atualizando dados financeiros e dashboard');
      await Promise.all([
        fetchDashboardData(),
        refreshFinancialData() // ✅ SINCRONIZAÇÃO: Refresh dos dados financeiros centralizados
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Em Atraso';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Residente</h1>
          <p className="text-muted-foreground">
            Visão geral da sua situação no condomínio {condominiumInfo?.name}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Remanescente Anual */}
      {saldoData && !remanescenteLoading && (
        <RemanescenteCard 
          data={saldoData} 
          currency={condominiumInfo?.currency || 'AOA'} 
        />
      )}

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('payments')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meus Pagamentos</p>
                <p className="text-2xl font-bold">{stats.myPayments.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.myPayments.paid} pagos • {stats.myPayments.pending} pendentes
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('visitors')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meus Visitantes</p>
                <p className="text-2xl font-bold">{stats.myVisitors.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.myVisitors.pending} pendentes
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('announcements')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anúncios</p>
                <p className="text-2xl font-bold">{stats.announcements.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.announcements.urgent} urgentes
                </p>
              </div>
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('specific-contributions')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contribuições</p>
                <p className="text-2xl font-bold">{stats.contributions.total}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.contributions.amount, 'AOA')} contribuído
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Situação Atual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pagamento do Mês Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Quota do Mês Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.myPayments.currentMonthAmount, condominiumInfo?.currency || 'AOA')}
                </p>
              </div>
              <div className="text-right">
                <Badge 
                  variant={stats.myPayments.currentMonthStatus === 'paid' ? 'default' : 'secondary'}
                  className={getPaymentStatusColor(stats.myPayments.currentMonthStatus)}
                >
                  {stats.myPayments.currentMonthStatus === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {getPaymentStatusLabel(stats.myPayments.currentMonthStatus)}
                </Badge>
              </div>
            </div>
            <Button 
              onClick={() => onNavigate('payments')} 
              className="w-full"
              variant={stats.myPayments.currentMonthStatus === 'paid' ? 'outline' : 'default'}
            >
              {stats.myPayments.currentMonthStatus === 'paid' ? 'Ver Histórico' : 'Efetuar Pagamento'}
            </Button>
          </CardContent>
        </Card>

        {/* Ações Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.myPayments.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div>
                  <p className="font-medium">Pagamentos Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.myPayments.pending} pagamento(s) pendente(s)
                  </p>
                </div>
                <Badge variant="destructive">{stats.myPayments.pending}</Badge>
              </div>
            )}

            {stats.myVisitors.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-medium">Visitantes Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.myVisitors.pending} visitante(s) aguardando aprovação
                  </p>
                </div>
                <Badge variant="secondary">{stats.myVisitors.pending}</Badge>
              </div>
            )}

            {stats.contributions.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">Contribuições Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.contributions.pending, 'AOA')} em contribuições pendentes
                  </p>
                </div>
                <Badge variant="outline">{stats.contributions.pending}</Badge>
              </div>
            )}

            {stats.myPayments.pending === 0 && stats.myVisitors.pending === 0 && stats.contributions.pending === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p>Tudo em dia! Não há ações pendentes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações do Apartamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações do Apartamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Apartamento</p>
              <p className="text-lg font-bold">{profile?.apartment_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Andar</p>
              <p className="text-lg font-bold">{profile?.floor || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Condomínio</p>
              <p className="text-lg font-bold">{condominiumInfo?.name || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}