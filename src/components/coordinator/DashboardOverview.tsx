import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, UserCheck, Building, AlertTriangle, Calculator, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRemanescenteAnual } from "@/hooks/useRemanescenteAnual";
import { RemanescenteCard } from "@/components/shared/RemanescenteCard";
import { useFinancialSync } from "@/hooks/useFinancialSync";

interface DashboardStats {
  totalResidents: number;
  pendingVisitors: number;
  activeProviders: number;
  pendingPayments: number;
  urgentAnnouncements: number;
  monthlyRevenue: number;
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  condominium: any;
  onRefresh: () => void;
}

export function DashboardOverview({ stats, condominium, onRefresh }: DashboardOverviewProps) {
  const { saldoData, loading: remanescenteLoading } = useRemanescenteAnual(condominium?.id);
  
  // ✅ SINCRONIZAÇÃO UNIFICADA: Usar hook centralizado para dados financeiros
  const { 
    stats: financialStats, 
    loading: financialLoading,
    refreshData: refreshFinancialData 
  } = useFinancialSync(condominium?.id);
  
  // ✅ DADOS SINCRONIZADOS: Usar stats financeiros quando disponível
  const syncedStats = {
    ...stats,
    monthlyRevenue: financialStats?.totalReceived || stats.monthlyRevenue,
    pendingPayments: financialStats?.totalPending || stats.pendingPayments
  };
  const formatCurrency = (amount: number) => {
    const currency = condominium?.currency || 'AOA';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total de Moradores",
      value: syncedStats.totalResidents,
      icon: Users,
      description: "Moradores registados",
      color: "text-blue-600",
    },
    {
      title: "Visitantes Pendentes",
      value: syncedStats.pendingVisitors,
      icon: UserCheck,
      description: "Aguardam aprovação",
      color: "text-orange-600",
    },
    {
      title: "Prestadores Ativos",
      value: syncedStats.activeProviders,
      icon: Building,
      description: "Prestadores autorizados",
      color: "text-green-600",
    },
    {
      title: "Pagamentos Pendentes",
      value: syncedStats.pendingPayments,
      icon: Calculator,
      description: "Deste mês",
      color: "text-red-600",
    },
    {
      title: "Anúncios Urgentes",
      value: syncedStats.urgentAnnouncements,
      icon: AlertTriangle,
      description: "Requerem atenção",
      color: "text-yellow-600",
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(syncedStats.monthlyRevenue),
      icon: TrendingUp,
      description: "Pagamentos recebidos",
      color: "text-emerald-600",
      isMonetary: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Visão geral do condomínio {condominium?.name}
          </p>
        </div>
        <Button 
          onClick={async () => {
            await Promise.all([onRefresh(), refreshFinancialData()]);
          }} 
          variant="outline" 
          size="sm" 
          className="self-start sm:self-auto"
          disabled={financialLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${financialLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
          <span className="sm:hidden">Atualizar</span>
        </Button>
      </div>

      {/* Cards de Remanescente Anual */}
      {saldoData && !remanescenteLoading && (
        <RemanescenteCard 
          data={saldoData} 
          currency={condominium?.currency || 'AOA'} 
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} flex-shrink-0`} />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stat.isMonetary ? stat.value : stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Ações Pendentes</span>
            </CardTitle>
            <CardDescription>
              Itens que requerem sua atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Visitantes pendentes
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.pendingVisitors} aguardam aprovação
                </p>
              </div>
              <Badge variant={syncedStats.pendingVisitors > 0 ? "destructive" : "secondary"}>
                {syncedStats.pendingVisitors}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Pagamentos em atraso
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {syncedStats.pendingPayments} pagamentos pendentes
                </p>
              </div>
              <Badge variant={syncedStats.pendingPayments > 0 ? "destructive" : "secondary"}>
                {syncedStats.pendingPayments}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Anúncios urgentes
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {syncedStats.urgentAnnouncements} anúncios urgentes publicados
                </p>
              </div>
              <Badge variant={syncedStats.urgentAnnouncements > 0 ? "destructive" : "secondary"}>
                {syncedStats.urgentAnnouncements}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Informações do Condomínio</span>
            </CardTitle>
            <CardDescription>
              Detalhes do seu condomínio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome</p>
                <p className="text-gray-900 dark:text-white">{condominium?.name || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Endereço</p>
                <p className="text-gray-900 dark:text-white">{condominium?.address || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Moeda</p>
                <p className="text-gray-900 dark:text-white">{condominium?.currency || 'AOA'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Código de Ligação</p>
                <p className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {condominium?.resident_linking_code || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}