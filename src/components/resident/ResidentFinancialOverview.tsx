import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  CreditCard,
  RefreshCw,
  Eye,
  PieChart,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useRemanescenteAnual } from "@/hooks/useRemanescenteAnual";
import { RemanescenteCard } from "@/components/shared/RemanescenteCard";
import { useFinancialSync } from "@/hooks/useFinancialSync";
import { formatCurrency } from "@/lib/currency";

interface ResidentFinancialOverviewProps {
  profile: any;
  condominiumInfo: any;
}

export default function ResidentFinancialOverview({ profile, condominiumInfo }: ResidentFinancialOverviewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // ✅ SINCRONIZAÇÃO UNIFICADA: Usar hook centralizado
  const { 
    stats, 
    payments, 
    loading, 
    refreshing, 
    refreshData 
  } = useFinancialSync(profile?.condominium_id, selectedMonth, selectedYear);

  const { saldoData, loading: remanescenteLoading } = useRemanescenteAnual(profile?.condominium_id);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const formatCurrencyLocal = (amount: number) => {
    return formatCurrency(amount, condominiumInfo?.currency || 'AOA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em atraso</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Situação Financeira</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Acompanhe a situação financeira do condomínio e os seus pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={`${selectedMonth}`} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={`${index}`}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={`${selectedYear}`} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <SelectItem key={year} value={`${year}`}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={refreshData} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Remanescente Anual Card */}
      {saldoData && !remanescenteLoading && (
        <RemanescenteCard 
          data={saldoData} 
          currency={condominiumInfo?.currency || 'AOA'} 
        />
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatCurrencyLocal(stats.totalReceived)}</p>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatCurrencyLocal(stats.totalPending)}</p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatCurrencyLocal(stats.totalOverdue)}</p>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatCurrencyLocal(stats.currentMonthlyFee)}</p>
                <p className="text-sm text-muted-foreground">Quota Mensal</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Payments Section - Simplified for resident view */}
      <Card className="feature-card border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
            <DollarSign className="w-5 h-5" />
            <span>Resumo dos Meus Pagamentos - {months[selectedMonth]} {selectedYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrencyLocal(stats.totalReceived)}</p>
              <p className="text-sm text-muted-foreground">Total Arrecadado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{formatCurrencyLocal(stats.totalPending)}</p>
              <p className="text-sm text-muted-foreground">Pendente no Mês</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
              <p className="text-sm text-muted-foreground">Total de Registos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Overview Table */}
      <Card className="feature-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumo de Pagamentos - {months[selectedMonth]} {selectedYear}</span>
            <Badge variant="outline">
              {payments.length} registos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartamento</TableHead>
                  <TableHead>Morador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.residents?.apartment_number || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.residents?.profiles?.first_name} {payment.residents?.profiles?.last_name}
                    </TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrencyLocal(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: pt })}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento encontrado para {months[selectedMonth]} {selectedYear}.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="feature-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-primary" />
              <span>Resumo Mensal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Arrecadado</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {payments.filter(p => p.status === 'paid').length} pagamentos
                  </p>
                </div>
                <p className="font-bold text-green-600">{formatCurrencyLocal(stats.totalReceived)}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">Pendente</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {payments.filter(p => p.status === 'pending').length} pagamentos
                  </p>
                </div>
                <p className="font-bold text-orange-600">{formatCurrencyLocal(stats.totalPending)}</p>
              </div>

              {stats.totalOverdue > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Em Atraso</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {payments.filter(p => p.status === 'overdue').length} pagamentos
                    </p>
                  </div>
                  <p className="font-bold text-red-600">{formatCurrencyLocal(stats.totalOverdue)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 w-5 text-primary" />
              <span>Informações Financeiras</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quota Mensal Atual</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyLocal(stats.currentMonthlyFee)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Apartamentos</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Set(payments.map(p => p.residents?.apartment_number)).size || 0}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Cobrança</p>
                <p className="text-lg font-semibold text-foreground">
                  {payments.length > 0 
                    ? `${Math.round((payments.filter(p => p.status === 'paid').length / payments.length) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}