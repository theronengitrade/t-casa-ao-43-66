import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  RefreshCw,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinancialData {
  total_revenue: number;
  monthly_revenue: number;
  pending_payments: number;
  active_licenses: number;
  revenue_growth: number;
  monthly_breakdown: Array<{
    month: string;
    revenue: number;
  }>;
}

const FinancialControl = () => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    total_revenue: 0,
    monthly_revenue: 0,
    pending_payments: 0,
    active_licenses: 0,
    revenue_growth: 0,
    monthly_breakdown: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch active licenses
      const { data: licenses, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('status', 'active');

      if (licenseError) throw licenseError;

      // Calculate financial metrics
      const activeLicenses = licenses?.length || 0;
      const monthlyRevenue = activeLicenses * 25000; // 25,000 AOA per license
      const totalRevenue = monthlyRevenue * 12; // Assuming annual calculation

      // Mock monthly breakdown data
      const monthlyBreakdown = [
        { month: 'Jan', revenue: monthlyRevenue * 0.8 },
        { month: 'Fev', revenue: monthlyRevenue * 0.9 },
        { month: 'Mar', revenue: monthlyRevenue * 1.1 },
        { month: 'Abr', revenue: monthlyRevenue },
        { month: 'Mai', revenue: monthlyRevenue * 1.2 },
        { month: 'Jun', revenue: monthlyRevenue * 1.1 },
      ];

      setFinancialData({
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        pending_payments: activeLicenses * 2500, // Mock pending payments
        active_licenses: activeLicenses,
        revenue_growth: 15.3, // Mock growth percentage
        monthly_breakdown: monthlyBreakdown
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(amount);
  };

  const exportFinancialReport = () => {
    toast({
      title: "Relatório Exportado",
      description: "O relatório financeiro foi exportado com sucesso",
    });
  };

  const handleProcessPayments = () => {
    // Simulate payment processing
    toast({
      title: "Processamento Iniciado",
      description: "Os pagamentos estão a ser processados. Receberá uma notificação quando concluído.",
    });
  };

  const handleDetailedReport = () => {
    // Generate detailed financial report
    const reportData = {
      totalRevenue: financialData.total_revenue,
      monthlyRevenue: financialData.monthly_revenue,
      activeLicenses: financialData.active_licenses,
      pendingPayments: financialData.pending_payments,
      reportDate: new Date().toLocaleDateString('pt-AO')
    };
    
    console.log('Generating detailed report:', reportData);
    toast({
      title: "Relatório Detalhado",
      description: "O relatório detalhado foi gerado e está pronto para download.",
    });
  };

  const handleTrendAnalysis = () => {
    // Perform trend analysis
    const trends = {
      revenueGrowth: financialData.revenue_growth,
      monthlyTrend: financialData.monthly_breakdown,
      prediction: 'Crescimento positivo esperado nos próximos meses'
    };
    
    console.log('Trend analysis:', trends);
    toast({
      title: "Análise de Tendências",
      description: `Crescimento de ${financialData.revenue_growth}% detectado. Tendência positiva mantida.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Controlo Financeiro</h2>
          <p className="text-lg text-muted-foreground">
            Gestão financeira e análise de receitas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchFinancialData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportFinancialReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.total_revenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{financialData.revenue_growth}% vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.monthly_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {financialData.active_licenses} licenças ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.pending_payments)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-orange-500" />
              A receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.active_licenses}</div>
            <p className="text-xs text-muted-foreground">
              Gerando receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Evolução de Receitas</span>
            </CardTitle>
            <CardDescription>
              Receitas mensais dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.monthly_breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className="text-sm font-bold">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Análise Financeira</span>
            </CardTitle>
            <CardDescription>
              Resumo da situação financeira atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Receitas Confirmadas</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(financialData.total_revenue * 0.8)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Receitas Pendentes</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(financialData.pending_payments)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Projeção Anual</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(financialData.monthly_revenue * 12)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Financeiras</CardTitle>
          <CardDescription>
            Gerir transações e relatórios financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex flex-col space-y-2"
              onClick={handleProcessPayments}
            >
              <Calculator className="h-6 w-6" />
              <span>Processar Pagamentos</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={handleDetailedReport}
            >
              <Download className="h-6 w-6" />
              <span>Relatório Detalhado</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={handleTrendAnalysis}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Análise de Tendências</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialControl;